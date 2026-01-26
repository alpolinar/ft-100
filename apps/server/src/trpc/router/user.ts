import z from "zod";
import { publicProcedure } from "../trpc";

const userRouter = publicProcedure
  .input(z.object({ id: z.number() }))
  .query(({ input }) => {
    const names = ["Rob", "Ron", "Rodney"];
    return { message: `hello ${names[input.id]}` };
  });

export { userRouter };
