import { gameRouter, userRouter } from "./routes/index.js";
import { router } from "./trpc.js";

export const appRouter = router({
  user: userRouter,
  game: gameRouter,
});

export type AppRouter = typeof appRouter;
