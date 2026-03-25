import { pipe } from "remeda";
import z from "zod";
import type { GameSlim } from "../../../domain/entities/game-event.entity.js";
import { protectedProcedure } from "../../trpc.js";
import {
  applySurrender,
  convertGameStateToSlim,
  emitGameUpdate,
  findGameOrThrow,
  toPlayerId,
} from "./helpers.js";
import { logger } from "./shared.js";

export const surrenderGame = protectedProcedure
  .input(
    z.object({
      gameId: z.string(),
    })
  )
  .mutation(async ({ input, ctx }): Promise<GameSlim> => {
    logger.info(
      { gameId: input.gameId, userId: ctx.user.id },
      "Player is surrendering"
    );

    const playerId = toPlayerId(ctx.user.id);
    const gameState = await findGameOrThrow(ctx.gameStore, input.gameId);

    const newState = applySurrender(gameState, playerId);

    await ctx.prisma
      .$transaction(async (tx) => {
        await tx.game.create({
          data: {
            id: newState.id,
            createdBy: newState.createdBy,
            invitedPlayerId: newState.invitedPlayerId ?? null,
            players: newState.players as Record<string, string>,
            currentTurn: newState.currentTurn,
            globalValue: newState.globalValue,
            status: newState.status,
            winnerId: newState.winnerId ?? null,
            version: newState.version,
          },
        });

        if (newState.moves.length > 0) {
          await tx.move.createMany({
            data: newState.moves.map((m) => ({
              gameId: newState.id,
              playerId: m.playerId,
              value: m.value,
              moveNumber: m.moveNumber,
              createdAt: m.timestamp,
            })),
          });
        }
      })
      .catch((err: unknown) => {
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          (err as { code: unknown }).code === "P2002"
        ) {
          logger.warn(
            { gameId: newState.id },
            "Game already persisted by another concurrent request (P2002)"
          );
        } else {
          throw err;
        }
      });

    await ctx.gameStore.delete(newState.id);
    logger.info(
      { gameId: newState.id },
      "Surrendered game persisted to Postgres and removed from Redis"
    );

    emitGameUpdate({
      gameId: input.gameId,
      payload: newState,
    });

    return pipe(newState, convertGameStateToSlim);
  });
