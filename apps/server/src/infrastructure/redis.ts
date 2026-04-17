import { Redis } from "ioredis";
import { env } from "../env.js";
import { getLogger } from "./logging/index.js";

const logger = getLogger();

import type { RedisOptions } from "ioredis";

const redisConfig: RedisOptions | string = env.REDIS_URL
  ? env.REDIS_URL
  : {
      host: env.REDIS_SERVICE_HOST,
      port: env.REDIS_SERVICE_PORT,
      password: env.REDIS_PASSWORD || undefined,
    };

const commonOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times: number) {
    return Math.min(times * 50, 2_000);
  },
};

const createClient = () => {
  if (typeof redisConfig === "string") {
    return new Redis(redisConfig, commonOptions);
  }
  return new Redis({ ...redisConfig, ...commonOptions });
};

export const redisClient = createClient();
export const pubClient = createClient();
export const subClient = createClient();

const setupEvents = (client: Redis, name: string) => {
  client.on("connect", () => logger.info(`Connected to Redis (${name})`));
  client.on("connecting", () =>
    logger.info(`Connecting to Redis (${name})...`)
  );
  client.on("error", (error) =>
    logger.error(error, `Redis connection severed (${name})...`)
  );
};

setupEvents(redisClient, "main");
setupEvents(pubClient, "pub");
setupEvents(subClient, "sub");
