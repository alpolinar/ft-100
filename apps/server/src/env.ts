import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["test", "development", "staging", "production"]),
  APP_PORT: z.coerce.number().default(3001),
  CLIENT_ORIGIN: z.url(),
  SECRET: z.string().min(1),
  REDIS_SERVICE_HOST: z.string().optional(),
  REDIS_SERVICE_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_URL: z.url().optional(),
  GAME_TTL_SECONDS: z.coerce.number().default(60 * 60 * 24), // 24 hours
  DATABASE_URL: z.string().min(1),
  RP_ID: z.string().min(1).default("localhost"),
  RP_NAME: z.string().min(1).default("FT-100"),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
});

const env = process.env.SKIP_ENV_VALIDATION
  ? (process.env as unknown as z.infer<typeof envSchema>)
  : envSchema
      .refine((data) => data.REDIS_URL || data.REDIS_SERVICE_HOST, {
        message: "Either REDIS_URL or REDIS_SERVICE_HOST must be provided",
        path: ["REDIS_URL"],
      })
      .parse(process.env);

export { env };
