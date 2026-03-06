import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { TRPCError } from "@trpc/server";
import z from "zod";
import {
  type User,
  UserIdSchema,
} from "../../../domain/entities/user.entity.js";
import { env } from "../../../env.js";
import { ChallengeStore } from "../../../infrastructure/persistence/challenge.store.js";
import { SessionStore } from "../../../infrastructure/persistence/session.store.js";
import { UserStore } from "../../../infrastructure/persistence/user.store.js";
import { protectedProcedure } from "../../trpc.js";

// ---------------------------------------------------------------------------
// Authentication – Step 1: Generate Options
// ---------------------------------------------------------------------------

export const generatePasskeyAuthenticationOptions = protectedProcedure
  .input(
    z
      .object({
        email: z.string().email().optional(),
      })
      .optional()
  )
  .mutation(async ({ ctx, input }) => {
    const challengeStore = new ChallengeStore(ctx.redisClient);

    // If an email is provided, look up the user's passkeys to suggest them
    let allowCredentials:
      | { id: string; transports?: AuthenticatorTransport[] }[]
      | undefined;

    let targetUserId: string | undefined;

    if (input?.email) {
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        include: { passkeys: { select: { id: true, transports: true } } },
      });

      if (!existingUser || existingUser.passkeys.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No passkeys found for this email.",
        });
      }

      targetUserId = existingUser.id;
      allowCredentials = existingUser.passkeys.map((p) => ({
        id: p.id,
        transports: p.transports as AuthenticatorTransport[],
      }));
    }

    const options = await generateAuthenticationOptions({
      rpID: env.RP_ID,
      userVerification: "preferred",
      ...(allowCredentials ? { allowCredentials } : {}),
    });

    // Store the challenge mapped to the *current* session user so we can
    // retrieve it later. We also tag the target userId if we know it.
    await challengeStore.set(
      ctx.user.id,
      JSON.stringify({
        challenge: options.challenge,
        targetUserId,
      })
    );

    return options;
  });

// ---------------------------------------------------------------------------
// Authentication – Step 2: Verify Response
// ---------------------------------------------------------------------------

export const verifyPasskeyAuthentication = protectedProcedure
  .input(
    z.object({
      response: z.any(), // AuthenticationResponseJSON from the browser
    })
  )
  .mutation(async ({ ctx, input }) => {
    const challengeStore = new ChallengeStore(ctx.redisClient);

    const storedData = await challengeStore.get(ctx.user.id);
    if (!storedData) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "No authentication challenge found. Please restart the login process.",
      });
    }

    let expectedChallenge: string;
    try {
      const parsed = JSON.parse(storedData);
      expectedChallenge = parsed.challenge;
    } catch {
      expectedChallenge = storedData;
    }

    // Find the passkey that was used to authenticate
    const credentialId = input.response.id;
    const passkey = await ctx.prisma.passkey.findUnique({
      where: { id: credentialId },
      include: { user: true },
    });

    if (!passkey) {
      await challengeStore.delete(ctx.user.id);
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Passkey not found.",
      });
    }

    const verification = await verifyAuthenticationResponse({
      response: input.response,
      expectedChallenge,
      expectedOrigin: env.CLIENT_ORIGIN,
      expectedRPID: env.RP_ID,
      credential: {
        id: passkey.id,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransport[],
      },
    });

    if (!verification.verified) {
      await challengeStore.delete(ctx.user.id);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Passkey authentication failed.",
      });
    }

    // Update the passkey counter to prevent replay attacks
    // and record the user's last login time.
    await ctx.prisma.$transaction([
      ctx.prisma.passkey.update({
        where: { id: passkey.id },
        data: {
          counter: verification.authenticationInfo.newCounter,
        },
      }),
      ctx.prisma.user.update({
        where: { id: passkey.userId },
        data: {
          lastLoginAt: new Date(),
        },
      }),
    ]);

    // Rebind the current session to the authenticated user
    const sessionStore = new SessionStore(ctx.redisClient);
    const userStore = new UserStore(ctx.redisClient);

    const authenticatedUserId = UserIdSchema.parse(passkey.userId);

    await sessionStore.create(ctx.sessionId, {
      userId: authenticatedUserId,
      createdAt: new Date(),
    });

    // Cache the authenticated user in Redis
    const authenticatedUser = {
      id: authenticatedUserId,
      type: passkey.user.type as "guest" | "registered",
      username: passkey.user.username ?? undefined,
      createdAt: passkey.user.createdAt,
    } satisfies User;
    await userStore.create(authenticatedUser);

    // Clean up the challenge
    await challengeStore.delete(ctx.user.id);

    // If the current user was a guest (and different from the authenticated user),
    // clean up the orphaned guest record
    if (ctx.user.type === "guest" && ctx.user.id !== authenticatedUserId) {
      await ctx.prisma.user.delete({ where: { id: ctx.user.id } }).catch(() => {
        // Non-critical: the guest may have games associated — soft-fail
      });
      await userStore.delete(ctx.user.id).catch(() => {});
    }

    return { verified: true, user: authenticatedUser };
  });

type AuthenticatorTransport =
  | "ble"
  | "cable"
  | "hybrid"
  | "internal"
  | "nfc"
  | "smart-card"
  | "usb";
