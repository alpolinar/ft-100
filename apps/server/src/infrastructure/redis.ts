import { Redis } from "ioredis";
import { env } from "../env.js";

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
