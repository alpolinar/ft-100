import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["test", "development", "staging", "production"]),
  APP_PORT: z.coerce.number().default(3001),
  CLIENT_ORIGIN: z.url(),
  SECRET: z.string(),
});

const env = envSchema.parse(process.env);

export { env };
