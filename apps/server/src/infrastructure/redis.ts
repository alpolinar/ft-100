import { Redis } from "ioredis";
import { env } from "../env.js";
import { getLogger } from "../logging/index.js";

export type RedisClient = InstanceType<typeof Redis>;

export const redisClient = new Redis({
  host: env.REDIS_SERVICE_HOST,
  port: env.REDIS_SERVICE_PORT,
});

const logger = getLogger();

redisClient.on("connect", () => {
  logger.info("Connected to Redis");
});

redisClient.on("connecting", () => {
  logger.info("Connecting to Redis...");
});

redisClient.on("error", (error) => {
  logger.error(error, "Redis connection servered...");
});
