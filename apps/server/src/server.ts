import type { FastifyCookieOptions } from "@fastify/cookie";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import redis, { type FastifyRedisPluginOptions } from "@fastify/redis";
import {
  type FastifyTRPCPluginOptions,
  fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import closeWithGrace from "close-with-grace";
import Fastify from "fastify";
import { env } from "./env.js";
import { pinoConfig } from "./infrastructure/logging/config.js";
import { bindFastifyLogger } from "./infrastructure/logging/index.js";
import { prisma } from "./infrastructure/prisma.js";
import { redisClient } from "./infrastructure/redis.js";
import { createContext } from "./trpc/context.js";
import { type AppRouter, appRouter } from "./trpc/router.js";

const allowedOrigins = [
  env.CLIENT_ORIGIN.replace(/\/$/, ""), // strip trailing slash
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

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

    const normalizedOrigin = origin.replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Reject unknown origins
    app.log.warn({ origin }, "CORS rejection");
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
  parseOptions: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  },
} satisfies FastifyCookieOptions);

app.register(redis, {
  client: redisClient,
  closeClient: true,
} satisfies FastifyRedisPluginOptions);

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

const closeListeners = closeWithGrace(
  { delay: 10000 },
  async ({ signal, err }) => {
    if (err) {
      app.log.error(err, "Server closing due to error");
    } else {
      app.log.info(`${signal} received, starting graceful shutdown`);
    }

    try {
      // 1. Drain active Fastify requests and trigger Fastify plugins' onClose hooks
      // (This automatically closes the Redis connection because of closeClient: true)
      await app.close();
      app.log.info("Fastify closed successfully");

      // 2. Disconnect Prisma connection pool
      await prisma.$disconnect();
      app.log.info("Prisma disconnected successfully");
    } catch (shutdownErr) {
      app.log.error(shutdownErr, "Error occurred during graceful shutdown");
    }
  }
);

app.addHook("onClose", async () => {
  closeListeners.uninstall();
});

(async () => {
  try {
    await redisClient.connect();
    await app.listen({
      host: "0.0.0.0",
      port: process.env.PORT ? Number(process.env.PORT) : env.APP_PORT,
    });

    app.log.info(`Server started in port: ${env.APP_PORT}`);
  } catch (error) {
    app.log.error(error, "Server failed to start");

    await redisClient.quit();
    await prisma.$disconnect();

    process.exit(1);
  }
})();
