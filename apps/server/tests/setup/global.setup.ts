import { execSync } from "node:child_process";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Client } from "pg";
import { parseTestEnv } from "./env.js";

let postgresContainer: StartedPostgreSqlContainer;

export async function setup() {
  postgresContainer = await new PostgreSqlContainer(
    "postgres:16-alpine"
  ).start();
  const url = postgresContainer.getConnectionUri();

  // Validate and parse the environment
  const testEnv = parseTestEnv({ DATABASE_URL: url });

  // Set the validated URL globally so test files can read it back via parseTestEnv()
  process.env.DATABASE_URL = testEnv.DATABASE_URL;

  execSync(
    `npx prisma db push --schema=prisma/schema.prisma --accept-data-loss`,
    {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: url,
      },
    }
  );
}

export async function teardown() {
  if (process.env.DATABASE_URL) {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    await client.query("DROP SCHEMA public CASCADE;");
    await client.end();
  }

  if (postgresContainer) {
    await postgresContainer.stop();
  }
}
