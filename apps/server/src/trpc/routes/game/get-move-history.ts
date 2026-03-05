import z from "zod";
import type { Move } from "../../../domain/entities/game.entity.js";
import { protectedProcedure } from "../../trpc.js";
import { logger } from "./shared.js";

export const getMoveHistory = protectedProcedure
  .input(z.object({ gameId: z.string() }))
  .query(async ({ input, ctx }): Promise<Move[]> => {
    // Try Redis first (active/in-progress games)
    const game = await ctx.gameStore.get(input.gameId);

    if (game) {
      logger.info(
        { gameId: input.gameId },
        "Returning move history from Redis"
      );
      return game.moves;
    }

    // Fall back to Postgres (finished games)
    logger.info(
      { gameId: input.gameId },
      "Returning move history from Postgres"
    );

    const moves = await ctx.prisma.move.findMany({
      where: { gameId: input.gameId },
      orderBy: { moveNumber: "asc" },
    });

    return moves.map((m) => ({
      playerId: m.playerId as Move["playerId"],
      value: m.value,
      moveNumber: m.moveNumber,
      timestamp: m.createdAt,
    }));
  });
