import crypto from "node:crypto";
import type {
  Game,
  PlayerId,
  TurnType,
} from "../../../domain/entities/game.entity.js";
import { arrayElement } from "../../../utils/index.js";
import { protectedProcedure } from "../../trpc.js";
import {
  emitGameUpdate,
  notifyMatchFound,
  startCountdown,
  toPlayerId,
} from "./helpers.js";
import { logger } from "./shared.js";

export const findMatch = protectedProcedure.mutation(
  async ({ ctx }): Promise<{ status: "matched" | "queued"; gameId?: string }> => {
    const currentPlayer = toPlayerId(ctx.user.id);

    logger.info({ userId: currentPlayer }, "Player looking for a match...");

    // Check if already queued
    const alreadyQueued =
      await ctx.matchmakingStore.isQueued(currentPlayer);
    if (alreadyQueued) {
      logger.info({ userId: currentPlayer }, "Player already in queue");
      return { status: "queued" };
    }

    // Try to find an opponent
    const opponentId = await ctx.matchmakingStore.dequeueOpponent(
      currentPlayer
    );

    if (opponentId) {
      // Match found — create a game with both players
      const now = new Date();
      const firstTurn = arrayElement<TurnType>(["p1", "p2"]) ?? "p1";

      const newGame: Game = {
        id: crypto.randomUUID(),
        createdBy: currentPlayer,
        players: {
          p1: opponentId as PlayerId,
          p2: currentPlayer,
        },
        currentTurn: firstTurn,
        globalValue: 0,
        status: "lobby",
        moves: [],
        createdAt: now,
        updatedAt: now,
        version: 1,
      };

      await ctx.gameStore.set(newGame);

      logger.info(
        { gameId: newGame.id, p1: opponentId, p2: currentPlayer },
        "Match found — game created"
      );

      // Notify the waiting player via pub/sub
      await notifyMatchFound(ctx.redisClient, opponentId, newGame.id);

      // Start the countdown since both players are present
      startCountdown(ctx.gameStore, newGame);

      // Emit initial game state for subscription
      emitGameUpdate({ gameId: newGame.id, payload: newGame });

      return { status: "matched", gameId: newGame.id };
    }

    // No opponent found — enqueue and wait
    await ctx.matchmakingStore.enqueue(currentPlayer);

    logger.info({ userId: currentPlayer }, "Player enqueued for matchmaking");

    return { status: "queued" };
  }
);
