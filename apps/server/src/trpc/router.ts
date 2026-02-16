import { gameRouter } from "./router/game.js";
import { userRouter } from "./router/user.js";
import { router } from "./trpc.js";

export const appRouter = router({
  user: userRouter,
  game: gameRouter,
});

export type AppRouter = typeof appRouter;
