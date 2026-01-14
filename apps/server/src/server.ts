import cors from "@fastify/cors";
import {
    type FastifyTRPCPluginOptions,
    fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { type AppRouter, appRouter } from "./trpc";
import { createContext } from "./trpc/context";

// TODO: replace with env variables
const allowedOrigins = [
    "http://localhost:3000", // Next.js dev
    "http://127.0.0.1:3000",
];

const app = Fastify({
    logger: true,
    routerOptions: {
        maxParamLength: 5000,
    },
});

app.register(cors, {
    origin: (origin, callback) => {
        // Allow no origin (e.g., mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Reject unknown origins
        return callback(new Error("Not allowed by CORS"), false);
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true, // allow JWT cookies, auth cookies, etc.
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Length"],
    maxAge: 86400, // cache preflight for 1 da
});

app.register(fastifyTRPCPlugin, {
    prefix: "/api",
    trpcOptions: {
        router: appRouter,
        createContext,
        onError: ({ path, error }) => {
            console.log(`Error in tRPC handler on path '${path}':`, error);
        },
    } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

app.get("/", async () => {
    return { message: "hello world" };
});

(async () => {
    try {
        await app.listen({
            port: 3001,
        });
    } catch (error) {
        app.log.error(error);
        process.exit(1);
    }
})();
