import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import crypto from "node:crypto";
import { match, P } from "ts-pattern";
import { sessionStore } from "../authentication/session-store";
import { userStore } from "../authentication/user-store";
import { SessionIdSchema } from "../entities/session";
import { UserIdSchema } from "../entities/user";

async function createAnonymousSession(ctx: CreateFastifyContextOptions) {
  const userId = UserIdSchema.parse(crypto.randomUUID());

  const user = await userStore.create({
    id: userId,
    type: "guest",
    createdAt: new Date(),
  });

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
  };
}

export async function createContext(ctx: CreateFastifyContextOptions) {
  const sessionId = SessionIdSchema.parse(ctx.req.cookies.session);

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
