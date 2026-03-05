import crypto from "node:crypto";
import { pipe } from "remeda";
import z from "zod";
import {
  type Game,
  type LobbyType,
  PlayerIdSchema,
  type TurnType,
} from "../../../domain/entities/game.entity.js";
import type { GameSlim } from "../../../domain/entities/game-event.entity.js";
import { arrayElement } from "../../../utils/index.js";
import { protectedProcedure } from "../../trpc.js";
import { convertGameStateToSlim, toPlayerId } from "./helpers.js";
import { logger } from "./shared.js";

export const createGame = protectedProcedure
  .input(
    z.object({
      lobbyType: z.enum<LobbyType[]>(["open", "invite"]),
      invitedPlayerId: PlayerIdSchema,
    })
  )
  .mutation(async ({ input, ctx }): Promise<GameSlim> => {
    const currentPlayer = toPlayerId(ctx.user.id);
    const now = new Date();

    logger.info({ userId: currentPlayer }, "Creating Game...");

    const newGame: Game = {
      id: crypto.randomUUID(),
      createdBy: currentPlayer,
      lobbyType: input.lobbyType,
      invitedPlayerId: input.invitedPlayerId,
      currentTurn: arrayElement<TurnType>(["p1", "p2"]) ?? "p1",
      players: {
        p1: currentPlayer,
      },
      globalValue: 0,
      status: "lobby",
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    await ctx.gameStore.set(newGame);

    logger.info({ gameId: newGame.id }, "Game Successfully Created");

    return pipe(newGame, convertGameStateToSlim);
  });
