import Redis from "ioredis";
import { env } from "../env";

export const redis = new Redis({
  host: env.REDIS_SERVICE_HOST,
  port: env.REDIS_SERVICE_PORT,
});
