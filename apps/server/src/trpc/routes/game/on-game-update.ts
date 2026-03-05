import { pipe } from "remeda";
import z from "zod";
import type { GameEvent } from "../../../domain/entities/game-event.entity.js";
import { createAsyncQueue } from "../../../utils/index.js";
import { protectedProcedure } from "../../trpc.js";
import { convertGameStateToSlim } from "./helpers.js";
import { gameEvents } from "./shared.js";

export const onGameUpdate = protectedProcedure
  .input(z.object({ gameId: z.string() }))
  .subscription(async function* ({
    input,
    ctx,
    signal,
  }): AsyncGenerator<GameEvent, void, unknown> {
    const game = await ctx.gameStore.get(input.gameId);
    const key = `game:${input.gameId}`;

    const queue = createAsyncQueue<GameEvent>();
    const handler = (event: GameEvent) => queue.push(event);

    if (game) {
      queue.push({
        kind: "game_event",
        payload: pipe(game, convertGameStateToSlim),
      });
    }

    gameEvents.on(key, handler);

    try {
      while (!signal?.aborted) {
        yield await queue.next();
      }
    } finally {
      gameEvents.off(key, handler);
    }
  });
