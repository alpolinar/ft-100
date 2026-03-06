import { SessionStore } from "../../../infrastructure/persistence/session.store.js";
import { protectedProcedure } from "../../trpc.js";

export const logout = protectedProcedure.mutation(async ({ ctx }) => {
  const sessionStore = new SessionStore(ctx.redisClient);

  // Delete the session from Redis
  await sessionStore.delete(ctx.sessionId);

  return { success: true };
});
