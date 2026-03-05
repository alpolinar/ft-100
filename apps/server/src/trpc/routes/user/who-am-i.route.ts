import { protectedProcedure } from "../../trpc.js";

export const whoami = protectedProcedure.query(({ ctx }) => ({
  user: ctx.user,
}));
