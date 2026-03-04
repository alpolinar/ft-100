import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["test", "development", "staging", "production"]),
  APP_PORT: z.coerce.number().default(3001),
  CLIENT_ORIGIN: z.url(),
  SECRET: z.string().min(1),
  REDIS_SERVICE_HOST: z.string().min(1),
  REDIS_SERVICE_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  GAME_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24), // 24 hours
  DATABASE_URL: z.string().min(1),
});

const env = envSchema.parse(process.env);

export { env };
