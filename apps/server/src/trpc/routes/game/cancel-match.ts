import { protectedProcedure } from "../../trpc.js";
import { toPlayerId } from "./helpers.js";
import { logger } from "./shared.js";

export const cancelMatch = protectedProcedure.mutation(
  async ({ ctx }): Promise<{ status: "cancelled" }> => {
    const currentPlayer = toPlayerId(ctx.user.id);

    await ctx.matchmakingStore.remove(currentPlayer);

    logger.info({ userId: currentPlayer }, "Player cancelled matchmaking");

    return { status: "cancelled" };
  }
);
