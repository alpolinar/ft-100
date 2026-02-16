import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import crypto from "node:crypto";
import { match, P } from "ts-pattern";
import type { PrismaClient } from "../../prisma/generated/prisma/client.js";
import { prisma } from "../db.js";
import { type SessionId, SessionIdSchema } from "../entities/session.js";
import { type User, UserIdSchema } from "../entities/user.js";
import { getLogger } from "../logging/index.js";
import { sessionStore } from "../store/session-store.js";
import { userStore } from "../store/user-store.js";

export type Context = {
  user: User;
  sessionId: SessionId;
  prisma: PrismaClient;
};

const logger = getLogger();

async function createAnonymousSession(
  ctx: CreateFastifyContextOptions
): Promise<Context> {
  logger.info("Creating new session...");
  const userId = UserIdSchema.parse(crypto.randomUUID());
  const sessionId = SessionIdSchema.parse(crypto.randomUUID());

  const user: User = {
    id: userId,
    type: "guest",
    createdAt: new Date(),
  };

  // Persist user once
  await prisma.user.create({
    data: {
      id: user.id,
      type: user.type,
    },
  });

  await userStore.create(user);
  await sessionStore.create(sessionId, {
    userId,
    createdAt: new Date(),
  });

  ctx.res.setCookie("session", sessionId);

  logger.info({ user, sessionId }, "New Session Created");

  return {
    user,
    sessionId,
    prisma,
  };
}

export async function createContext(
  ctx: CreateFastifyContextOptions
): Promise<Context> {
  logger.info({ sessionId: ctx.req.cookies.session }, "Current Session");
  return match(ctx.req.cookies.session)
    .with(P.string, async (rawSessionId) => {
      const sessionId = SessionIdSchema.safeParse(rawSessionId);

      if (!sessionId.success) {
        logger.warn("Invalid Session Cookie");
        return createAnonymousSession(ctx);
      }

      const session = await sessionStore.get(sessionId.data);
      if (!session) {
        logger.info({ sessionId: sessionId.data }, "Session Not Found!");
        return createAnonymousSession(ctx);
      }

      const user = await userStore.get(session.userId);
      logger.info(user, "createContext user");

      if (!user) {
        logger.info(
          { userId: session.userId, sessionId: sessionId.data },
          "Session User Not Found"
        );
        return createAnonymousSession(ctx);
      }

      return {
        user,
        sessionId: sessionId.data,
        prisma,
      };
    })
    .otherwise(async () => {
      logger.info("No Current Session");
      return createAnonymousSession(ctx);
    });
}
