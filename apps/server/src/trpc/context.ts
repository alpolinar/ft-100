import crypto from "node:crypto";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { match, P } from "ts-pattern";
import { type SessionId, sessionStore } from "../authentication/session-store";
import { userStore } from "../authentication/user-store";
import type { UserId } from "../entities/user";

async function createAnonymousSession(ctx: CreateFastifyContextOptions) {
  const userId = crypto.randomUUID() as UserId;

  const user = await userStore.create({
    id: userId,
    type: "guest",
    createdAt: new Date(),
  });

  const sessionId = crypto.randomUUID() as SessionId;

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
  };
}

export async function createContext(ctx: CreateFastifyContextOptions) {
  const sessionId = ctx.req.cookies.session as SessionId;

  return match(sessionId)
    .with(P.string, async (sessionId) => {
      const session = await sessionStore.get(sessionId);

      if (!session) {
        return createAnonymousSession(ctx);
      }

      const user = await userStore.get(session.userId);

      if (!user) {
        return createAnonymousSession(ctx);
      }

      return {
        user,
        sessionId,
      };
    })
    .otherwise(async () => createAnonymousSession(ctx));
}

export type Context = Awaited<ReturnType<typeof createContext>>;
