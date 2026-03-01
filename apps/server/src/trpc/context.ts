import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import type { Redis } from "ioredis";
import type { PrismaClient } from "../../prisma/generated/prisma/client.js";
import { prisma } from "../db.js";
import {
  type SessionId,
  SessionIdSchema,
} from "../entities/session/session.js";
import { SessionStore } from "../entities/session/session-store.js";
import { type User, UserIdSchema } from "../entities/user/user.js";
import { UserStore } from "../entities/user/user-store.js";

export type Context = {
  user: User;
  sessionId: SessionId;
  prisma: PrismaClient;
  redisClient: Redis;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Attempt to recover a user from Postgres when the Redis cache is cold.
 * Returns the re-hydrated user on success, or null if it no longer exists.
 */
async function rehydrateUser(
  userStore: UserStore,
  userId: string
): Promise<User | null> {
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!dbUser) return null;

  const user: User = {
    id: UserIdSchema.parse(dbUser.id),
    type: dbUser.type,
    createdAt: dbUser.createdAt,
  };

  // Re-populate Redis so the next request is a cache hit
  await userStore.create(user);

  return user;
}

/**
 * Create a brand-new anonymous guest session and set the session cookie.
 *
 * Write order: Postgres first (source of truth), then Redis.
 * If the Redis writes fail, the Postgres row is deleted as a compensating action.
 */
async function buildAnonymousContext(
  ctx: CreateFastifyContextOptions,
  redisClient: Redis
): Promise<Context> {
  const logger = ctx.req.log;
  logger.info("Creating new anonymous session");

  const userStore = new UserStore(redisClient);
  const sessionStore = new SessionStore(redisClient);

  const userId = UserIdSchema.parse(crypto.randomUUID());
  const sessionId = SessionIdSchema.parse(crypto.randomUUID());

  const user: User = {
    id: userId,
    type: "guest",
    createdAt: new Date(),
  };

  // 1. Write to Postgres – authoritative record
  await prisma.user.create({
    data: { id: user.id, type: user.type },
  });

  // 2. Write to Redis – compensate Postgres on failure to keep stores consistent
  try {
    await userStore.create(user);
    await sessionStore.create(sessionId, { userId, createdAt: new Date() });
  } catch (err) {
    logger.error(
      { err, userId },
      "Redis write failed during session creation — rolling back Postgres row"
    );
    await prisma.user.delete({ where: { id: userId } }).catch((reason) => {
      logger.error({ userId, reason }, "Failed to delete anonymous session.");
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create anonymous session.",
    });
  }

  ctx.res.setCookie("session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  logger.info({ userId, sessionId }, "Anonymous session created");

  return { user, sessionId, prisma, redisClient };
}

// ---------------------------------------------------------------------------
// Main context factory
// ---------------------------------------------------------------------------

export async function createContext(
  ctx: CreateFastifyContextOptions
): Promise<Context> {
  const logger = ctx.req.log;
  const redisClient = ctx.req.server.redis;
  const rawCookie = ctx.req.cookies.session;

  // ── 1. No cookie at all ──────────────────────────────────────────────────
  if (!rawCookie) {
    logger.info("No session cookie — issuing anonymous session");
    return buildAnonymousContext(ctx, redisClient);
  }

  // ── 2. Malformed cookie ──────────────────────────────────────────────────
  const parsedSessionId = SessionIdSchema.safeParse(rawCookie);
  if (!parsedSessionId.success) {
    logger.warn(
      { rawCookie },
      "Malformed session cookie — issuing anonymous session"
    );
    return buildAnonymousContext(ctx, redisClient);
  }

  const sessionId = parsedSessionId.data;
  const sessionStore = new SessionStore(redisClient);
  const userStore = new UserStore(redisClient);

  // ── 3. Session not in Redis ──────────────────────────────────────────────
  const session = await sessionStore.get(sessionId);
  if (!session) {
    logger.info({ sessionId }, "Session not found — issuing anonymous session");
    return buildAnonymousContext(ctx, redisClient);
  }

  // ── 4. Resolve user (Redis cache → Postgres fallback) ───────────────────
  let user = await userStore.get(session.userId);

  if (!user) {
    logger.info(
      { userId: session.userId },
      "User not in Redis — attempting Postgres fallback"
    );
    user = await rehydrateUser(userStore, session.userId);
  }

  if (!user) {
    // Session points to a user that doesn't exist anywhere — clean up the orphan
    logger.warn(
      { sessionId, userId: session.userId },
      "User unrecoverable — deleting orphaned session and issuing anonymous session"
    );
    await sessionStore.delete(sessionId).catch(() => {});
    return buildAnonymousContext(ctx, redisClient);
  }

  // ── 5. Happy path ────────────────────────────────────────────────────────
  // Refresh TTL so active users don't expire mid-session
  await sessionStore.refresh(sessionId);

  logger.debug({ userId: user.id, sessionId }, "Session resolved");

  return { user, sessionId, prisma, redisClient };
}
