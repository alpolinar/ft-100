import crypto from "node:crypto";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { match, P } from "ts-pattern";
import type { PrismaClient } from "../../prisma/generated/prisma/client";
import { prisma } from "../db.js";
import { type SessionId, SessionIdSchema } from "../entities/session";
import { type User, UserIdSchema } from "../entities/user";
import { getLogger } from "../logging";
import { sessionStore } from "../store/session-store";
import { userStore } from "../store/user-store";

export type Context = {
  user: User;
  sessionId: SessionId;
  prisma: PrismaClient;
};

const logger = getLogger();

async function createAnonymousSession(
  ctx: CreateFastifyContextOptions
): Promise<Context> {
  const userId = UserIdSchema.parse(crypto.randomUUID());

  const user = await userStore.create({
    id: userId,
    type: "guest",
    createdAt: new Date(),
  });

  const existingUser = await prisma.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: user.id,
        type: user.type,
      },
    });
  }

  const sessionId = SessionIdSchema.parse(crypto.randomUUID());

  await sessionStore.create(sessionId, {
    userId,
    createdAt: new Date(),
  });

  ctx.res.setCookie("session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return {
    user,
    sessionId,
    prisma,
  };
}

export async function createContext(
  ctx: CreateFastifyContextOptions
): Promise<Context> {
  return match(ctx.req.cookies.session)
    .with(P.string, async (id) => {
      const sessionId = SessionIdSchema.parse(id);
      logger.info({ sessionId }, "sessionId");
      const session = await sessionStore.get(sessionId);
      logger.info(session, "session");

      if (!session) {
        logger.info("!session");
        return createAnonymousSession(ctx);
      }

      const user = await userStore.get(session.userId);
      logger.info(user, "user");

      if (!user) {
        logger.info("!user");
        return createAnonymousSession(ctx);
      }

      return {
        user,
        sessionId,
        prisma,
      };
    })
    .otherwise(async () => createAnonymousSession(ctx));
}
