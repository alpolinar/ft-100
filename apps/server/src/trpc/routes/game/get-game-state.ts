import { pipe } from "remeda";
import z from "zod";
import type { GameSlim } from "../../../domain/entities/game-event.entity.js";
import { protectedProcedure } from "../../trpc.js";
import { convertGameStateToSlim, findGameOrThrow } from "./helpers.js";

export const getGameState = protectedProcedure
  .input(z.object({ gameId: z.string() }))
  .query(async ({ input, ctx }): Promise<GameSlim> => {
    const gameState = await findGameOrThrow(ctx.gameStore, input.gameId);

    return pipe(gameState, convertGameStateToSlim);
  });
