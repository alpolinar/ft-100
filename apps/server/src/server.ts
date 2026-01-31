import type { FastifyCookieOptions } from "@fastify/cookie";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import {
  type FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import Fastify from "fastify";
import { env } from "./env";
import { bindFastifyLogger } from "./logging";
import { pinoConfig } from "./logging/config";
import { createContext } from "./trpc/context";
import { type AppRouter, appRouter } from "./trpc/router";

const allowedOrigins = [env.CLIENT_ORIGIN];

const app = Fastify({
  logger: pinoConfig,
  routerOptions: {
    maxParamLength: 5000,
  },
});

bindFastifyLogger(app.log);

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

app.register(cookie, {
  secret: env.SECRET,
  parseOption: {},
} as FastifyCookieOptions);

app.register(fastifyTRPCPlugin, {
  prefix: "/api",
  trpcOptions: {
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      app.log.error(error, `Error in tRPC handler on path '${path}'`);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

app.get("/healthcheck", () => {
  return { message: `hello from the server ${new Date()}` };
});

(async () => {
  try {
    await app.listen({
      port: env.APP_PORT,
    });
    app.log.info(`Server started in port: ${env.APP_PORT}`);
  } catch (error) {
    app.log.error(error, "Server failed to start");
    process.exit(1);
  }
})();
