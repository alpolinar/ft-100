import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter: ({ shape }) => shape,
    sse: {
        ping: {
            enabled: true,
            intervalMs: 2_000,
        },
    },
});

export const router = t.router;
export const publicProcedure = t.procedure;
