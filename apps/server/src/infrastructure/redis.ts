import { Redis } from "ioredis";
import { env } from "../env.js";
import { getLogger } from "./logging/index.js";

const logger = getLogger();

import type { RedisOptions } from "ioredis";

const commonOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times: number) {
    return Math.min(times * 50, 2_000);
  },
};

const setupEvents = (client: Redis, name: string) => {
  client.on("connect", () => logger.info(`Connected to Redis (${name})`));
  client.on("connecting", () =>
    logger.info(`Connecting to Redis (${name})...`)
  );
  client.on("error", (error) =>
    logger.error(error, `Redis connection severed (${name})...`)
  );
};

const createLazyClient = (name: string) => {
  let _client: Redis | undefined;
  return new Proxy({} as Redis, {
    get(_target, prop, receiver) {
      if (!_client) {
        const redisConfig: RedisOptions | string = env.REDIS_URL
          ? env.REDIS_URL
          : {
              host: env.REDIS_SERVICE_HOST,
              port: env.REDIS_SERVICE_PORT,
              password: env.REDIS_PASSWORD || undefined,
            };
        _client =
          typeof redisConfig === "string"
            ? new Redis(redisConfig, commonOptions)
            : new Redis({ ...redisConfig, ...commonOptions });
        setupEvents(_client, name);
      }
      const value = Reflect.get(_client, prop, receiver);
      return typeof value === "function" ? value.bind(_client) : value;
    },
  });
};

export const redisClient = createLazyClient("main");
export const pubClient = createLazyClient("pub");
export const subClient = createLazyClient("sub");
