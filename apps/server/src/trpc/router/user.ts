import { protectedProcedure, router } from "../trpc";

const userRouter = router({
  whoami: protectedProcedure.query(({ ctx }) => {
    return {
      user: ctx.user,
    };
  }),
});

export { userRouter };
