import { TRPCError } from "@trpc/server";
import z from "zod";
import { EmailService } from "../../../infrastructure/email/email.service.js";
import { EmailVerificationStore } from "../../../infrastructure/persistence/email-verification.store.js";
import { protectedProcedure } from "../../trpc.js";
import { logger } from "../game/shared.js";

// ---------------------------------------------------------------------------
// Generate a random 6-digit code
// ---------------------------------------------------------------------------

function generateSixDigitCode(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}

// ---------------------------------------------------------------------------
// Send Email Verification Code
// ---------------------------------------------------------------------------

export const sendEmailVerificationCode = protectedProcedure
  .input(
    z.object({
      email: z.email(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const store = new EmailVerificationStore(ctx.redisClient);
    const emailService = new EmailService();

    // Check if a code was recently sent (rate limiting via key existence)
    const existing = await store.getCode(ctx.user.id);
    if (existing && !existing.verified && existing.email === input.email) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message:
          "A verification code was already sent. Please check your email or wait for it to expire before requesting a new one.",
      });
    }

    const code = generateSixDigitCode();
    await store.setCode(ctx.user.id, input.email, code);

    try {
      await emailService.sendVerificationCode(input.email, code);
    } catch (error) {
      logger.error({ error }, "Failed to send verification email:");
      // Clean up Redis entry if email fails to send
      await store.delete(ctx.user.id);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to send verification email. Please try again.",
      });
    }

    return { success: true };
  });

// ---------------------------------------------------------------------------
// Verify Email Code
// ---------------------------------------------------------------------------

export const verifyEmailCode = protectedProcedure
  .input(
    z.object({
      email: z.email(),
      code: z.string().length(6),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const store = new EmailVerificationStore(ctx.redisClient);

    const stored = await store.getCode(ctx.user.id);
    if (!stored) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No verification code found. Please request a new code.",
      });
    }

    if (stored.email !== input.email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email does not match the one the code was sent to.",
      });
    }

    if (stored.code !== input.code) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid verification code. Please try again.",
      });
    }

    // Mark as verified with extended TTL
    await store.markVerified(ctx.user.id);

    return { verified: true };
  });
