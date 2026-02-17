import crypto from "node:crypto";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
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

type AnonSession = Pick<Context, "user" | "sessionId">;

const logger = getLogger();

async function createAnonymousSession(
  ctx: CreateFastifyContextOptions
): Promise<AnonSession> {
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

  ctx.res.setCookie("session", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  logger.info({ user, sessionId }, "New Session Created");

  return {
    user,
    sessionId,
  };
}

export async function createContext(
  ctx: CreateFastifyContextOptions
): Promise<Context> {
  return match(ctx.req.cookies.session)
    .with(P.string, async (rawSessionId) => {
      const parsedSessionId = SessionIdSchema.safeParse(rawSessionId);

      if (!parsedSessionId.success) {
        logger.warn(
          { sessionId: parsedSessionId.data },
          "Invalid Session Cookie"
        );

        const newSession = await createAnonymousSession(ctx);
        return {
          ...newSession,
          prisma,
        };
      }

      const session = await sessionStore.get(parsedSessionId.data);
      if (!session) {
        logger.info({ sessionId: parsedSessionId.data }, "Session Not Found!");

        const newSession = await createAnonymousSession(ctx);
        return {
          ...newSession,
          prisma,
        };
      }

      const user = await userStore.get(session.userId);
      if (!user) {
        logger.info(
          { userId: session.userId, sessionId: parsedSessionId.data },
          "Session User Not Found"
        );

        const newSession = await createAnonymousSession(ctx);
        return {
          ...newSession,
          prisma,
        };
      }

      return {
        user,
        sessionId: parsedSessionId.data,
        prisma,
      };
    })
    .otherwise(async () => {
      logger.info("No Current Session");

      const newSession = await createAnonymousSession(ctx);
      return {
        ...newSession,
        prisma,
      };
    });
}
