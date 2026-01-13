import z from "zod";
import { publicProcedure } from "../trpc";

const apiRouter = publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
        return { message: `hello ${input.name}` };
    });

export { apiRouter };
