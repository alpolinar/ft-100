import Redis from "ioredis";
import { env } from "../env";
import { getLogger } from "../logging";

export const redis = new Redis({
  host: env.REDIS_SERVICE_HOST,
  port: env.REDIS_SERVICE_PORT,
});

const logger = getLogger();

redis.on("connect", () => {
  logger.info("Successfully connected to Redis server");
});

redis.on("error", (error) => {
  logger.error(error, "Failed to connect to Redis server");
});
