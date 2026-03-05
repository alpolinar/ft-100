import { TRPCError } from "@trpc/server";
import z from "zod";
import type { Game } from "../../../domain/entities/game.entity.js";
import { protectedProcedure } from "../../trpc.js";
import {
  emitGameUpdate,
  findGameOrThrow,
  startCountdown,
  toPlayerId,
} from "./helpers.js";
import { logger } from "./shared.js";

export const joinGame = protectedProcedure
  .input(z.object({ gameId: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const currentPlayer = toPlayerId(ctx.user.id);
    const gameState = await findGameOrThrow(ctx.gameStore, input.gameId);

    logger.info(
      { gameId: input.gameId, userId: currentPlayer },
      "Player is joining game"
    );

    const { p1, p2 } = gameState.players;

    if (p1 === currentPlayer || p2 === currentPlayer) {
      logger.info(
        { gameId: input.gameId, userId: currentPlayer },
        "Player already joined"
      );

      return {
        status: true,
        message: "Player already joined",
      };
    }

    if (p1 && p2) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Lobby full." });
    }

    const newState: Game = {
      ...gameState,
      players: {
        p1: gameState.players.p1,
        p2: p2 ?? currentPlayer,
      },
    };

    await ctx.gameStore.set(newState);

    if (
      newState.players.p1 &&
      newState.players.p2 &&
      newState.status === "lobby"
    ) {
      startCountdown(ctx.gameStore, newState);
    }

    emitGameUpdate({
      gameId: input.gameId,
      payload: newState,
    });

    logger.info({ userId: ctx.user.id }, "Player has joined the game");

    return {
      status: true,
      message: "Game joined",
    };
  });
