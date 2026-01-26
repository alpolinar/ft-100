import { gameRouter } from "./router/game";
import { userRouter } from "./router/user";
import { router } from "./trpc";

export const appRouter = router({
  user: userRouter,
  game: gameRouter,
});

export type AppRouter = typeof appRouter;
