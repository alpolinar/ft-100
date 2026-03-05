import { gameRouter } from "./routes/game/game.route.js";
import { userRouter } from "./routes/user/user.route.js";
import { router } from "./trpc.js";

export const appRouter = router({
  user: userRouter,
  game: gameRouter,
});

export type AppRouter = typeof appRouter;
