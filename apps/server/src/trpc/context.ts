import crypto from "node:crypto";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { match, P } from "ts-pattern";
import { type SessionId, SessionIdSchema } from "../entities/session";
import { type User, UserIdSchema } from "../entities/user";
import { sessionStore } from "../stores/session-store";
import { userStore } from "../stores/user-store";

export type Context = {
  user: User;
  sessionId: SessionId;
};

async function createAnonymousSession(
  ctx: CreateFastifyContextOptions
): Promise<Context> {
  const userId = UserIdSchema.parse(crypto.randomUUID());

  const user = await userStore.create({
    id: userId,
    type: "guest",
    createdAt: new Date(),
  });

  const session = await sessionStore.create({
    userId,
    createdAt: new Date(),
  });

  const sessionId = SessionIdSchema.parse(session.id);

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

export async function createContext(
  ctx: CreateFastifyContextOptions
): Promise<Context> {
  const sessionId = ctx.req.cookies.session
    ? SessionIdSchema.parse(ctx.req.cookies.session)
    : undefined;

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
