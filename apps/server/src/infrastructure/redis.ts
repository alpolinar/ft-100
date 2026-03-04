import { Redis } from "ioredis";
import { env } from "../env.js";
import { getLogger } from "./logging/index.js";

const logger = getLogger();

export const redisClient = new Redis({
  host: env.REDIS_SERVICE_HOST,
  port: env.REDIS_SERVICE_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy(times) {
    // Exponential backoff: 50ms, 100ms, 200ms … capped at 2 s
    return Math.min(times * 50, 2_000);
  },
});

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

redisClient.on("connecting", () => {
  logger.info("Connecting to Redis...");
});

redisClient.on("error", (error) => {
  logger.error(error, "Redis connection severed...");
});
