import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url(),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const env = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
});

export { env };
