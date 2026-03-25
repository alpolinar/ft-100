import { createAsyncQueue } from "../../../utils/index.js";
import { protectedProcedure } from "../../trpc.js";
import { toPlayerId } from "./helpers.js";
import { gameEvents } from "./shared.js";

type MatchFoundEvent = {
  gameId: string;
};

export const onMatchFound = protectedProcedure.subscription(
  async function* ({
    ctx,
    signal,
  }): AsyncGenerator<MatchFoundEvent, void, unknown> {
    const currentPlayer = toPlayerId(ctx.user.id);
    const channel = `matchmaking:${currentPlayer}`;

    const queue = createAsyncQueue<MatchFoundEvent>();
    const handler = (event: MatchFoundEvent) => queue.push(event);

    const listener = gameEvents.on(channel, handler);

    try {
      while (!signal?.aborted) {
        yield await queue.next();
      }
    } finally {
      gameEvents.off(channel, listener);
    }
  }
);
