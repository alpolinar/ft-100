import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "../../prisma/generated/prisma/client.js";
import { parseTestEnv } from "../setup/env.js";

describe("Database Integration", () => {
  let prisma: PrismaClient;
  let pool: Pool;

  beforeAll(async () => {
    // parseTestEnv validates that global.setup.ts successfully injected DATABASE_URL
    const testEnv = parseTestEnv();

    pool = new Pool({ connectionString: testEnv.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
  });

  it("can connect to the database and query users", async () => {
    const users = await prisma.user.findMany();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(0);
  });
});
