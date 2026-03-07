import "dotenv/config";
import z from "zod";

const testEnvSchema = z.object({
  NODE_ENV: z
    .enum(["test", "development", "staging", "production"])
    .default("test"),
  DATABASE_URL: z.string().min(1),
});

// Since test environments populate dynamic ports/hosts on the fly (via Testcontainers),
// we export a function parser rather than parsing immediately on file load.
export const parseTestEnv = (envOverrides?: Record<string, string>) => {
  return testEnvSchema.parse({
    ...process.env,
    ...envOverrides,
  });
};
