import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "../../../infrastructure/cookie.js";
import { SessionStore } from "../../../infrastructure/persistence/session.store.js";
import { protectedProcedure } from "../../trpc.js";

export const logout = protectedProcedure.mutation(async ({ ctx }) => {
  const sessionStore = new SessionStore(ctx.redisClient);

  // Delete the session from Redis
  await sessionStore.delete(ctx.sessionId);

  // Clear the cookie from the browser
  ctx.res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);

  return { success: true };
});
