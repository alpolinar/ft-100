import { Redis } from "ioredis";
import { env } from "../env.js";

export type RedisClient = InstanceType<typeof Redis>;

export const redisClient = new Redis({
  host: env.REDIS_SERVICE_HOST,
  port: env.REDIS_SERVICE_PORT,
});
