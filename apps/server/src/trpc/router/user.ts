import { protectedProcedure, router } from "../trpc.js";

const userRouter = router({
  whoami: protectedProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
    };
  }),
});

export { userRouter };
