import EventEmitter from "events";
import z from "zod";
import { createAsyncQueue } from "../async-queue-helper";
import { publicProcedure, router } from "../trpc";

type GameEvent =
    | { type: "state_updated"; state: { value: number } }
    | { type: "game_finished" };

const gameEvents = new EventEmitter();

const gameRouter = router({
    makeMove: publicProcedure
        .input(z.object({ gameId: z.string(), value: z.number() }))
        .mutation(({ input }) => {
            gameEvents.emit<GameEvent>(`game:${input.gameId}`, {
                type: "state_updated",
                state: { value: input.value },
            });
            return "hello";
        }),
    onGameUpdate: publicProcedure
        .input(z.object({ gameId: z.string() }))
        .subscription(async function* ({ input, signal }) {
            const queue = createAsyncQueue<GameEvent>();
            const handler = (event: GameEvent) => {
                queue.push(event);
            };

            gameEvents.on(`game:${input.gameId}`, handler);

            try {
                while (!signal?.aborted) {
                    yield await queue.next();
                }
            } finally {
                gameEvents.off(`game:${input.gameId}`, handler);
            }
        }),
});

export { gameRouter };
