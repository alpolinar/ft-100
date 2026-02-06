import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["test", "development", "staging", "production"]),
  APP_PORT: z.coerce.number().default(3001),
  CLIENT_ORIGIN: z.url(),
  SECRET: z.string(),
  REDIS_SERVICE_HOST: z.string(),
  REDIS_SERVICE_PORT: z.coerce.number().default(6379),
  DATABASE_URL: z.string(),
});

const env = envSchema.parse(process.env);

export { env };
