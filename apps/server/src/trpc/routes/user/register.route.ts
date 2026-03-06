import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { env } from "../../../env.js";
import { ChallengeStore } from "../../../infrastructure/persistence/challenge.store.js";
import { protectedProcedure } from "../../trpc.js";

// ---------------------------------------------------------------------------
// Registration – Step 1: Generate Options
// ---------------------------------------------------------------------------

export const generatePasskeyRegistrationOptions = protectedProcedure
  .input(
    z.object({
      username: z.string().min(1).max(64),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const challengeStore = new ChallengeStore(ctx.redisClient);

    // Fetch any existing passkeys for this user to exclude re-registration
    const existingPasskeys = await ctx.prisma.passkey.findMany({
      where: { userId: ctx.user.id },
      select: { id: true, transports: true },
    });

    const options = await generateRegistrationOptions({
      rpName: env.RP_NAME,
      rpID: env.RP_ID,
      userName: input.username,
      userDisplayName: input.username,
      excludeCredentials: existingPasskeys.map((passkey) => ({
        id: passkey.id,
        transports: passkey.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    // Store the challenge temporarily in Redis so we can verify it in step 2
    await challengeStore.set(ctx.user.id, options.challenge);

    return options;
  });

// ---------------------------------------------------------------------------
// Registration – Step 2: Verify Response
// ---------------------------------------------------------------------------

export const verifyPasskeyRegistration = protectedProcedure
  .input(
    z.object({
      username: z.string().min(1).max(64),
      email: z.string().email().optional(),
      response: z.any(), // The RegistrationResponseJSON from the browser
    })
  )
  .mutation(async ({ ctx, input }) => {
    const challengeStore = new ChallengeStore(ctx.redisClient);

    const expectedChallenge = await challengeStore.get(ctx.user.id);
    if (!expectedChallenge) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "No registration challenge found. Please restart the registration process.",
      });
    }

    const verification = await verifyRegistrationResponse({
      response: input.response,
      expectedChallenge,
      expectedOrigin: env.CLIENT_ORIGIN,
      expectedRPID: env.RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      // Clean up the challenge
      await challengeStore.delete(ctx.user.id);
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Passkey registration verification failed.",
      });
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // Persist the passkey in Postgres and upgrade the user in a single transaction
    await ctx.prisma.$transaction([
      ctx.prisma.passkey.create({
        data: {
          id: credential.id,
          publicKey: Buffer.from(credential.publicKey),
          userId: ctx.user.id,
          webAuthnUserId: ctx.user.id,
          counter: credential.counter,
          deviceType: credentialDeviceType,
          backedUp: credentialBackedUp,
          transports: credential.transports ?? [],
        },
      }),
      ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: {
          type: "registered",
          username: input.username,
          lastLoginAt: new Date(),
          ...(input.email ? { email: input.email } : {}),
        },
      }),
    ]);

    // Clean up the challenge
    await challengeStore.delete(ctx.user.id);

    return { verified: true };
  });

// Re-export the AuthenticatorTransport type locally so we don't need an extra import
type AuthenticatorTransport =
  | "ble"
  | "cable"
  | "hybrid"
  | "internal"
  | "nfc"
  | "smart-card"
  | "usb";
