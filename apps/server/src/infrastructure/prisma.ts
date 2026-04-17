import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { env } from "../env.js";

let _prisma: PrismaClient | undefined;

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!_prisma) {
      const connectionString = `${env.DATABASE_URL}`;
      const adapter = new PrismaPg({ connectionString });
      _prisma = new PrismaClient({ adapter });
    }
    const value = Reflect.get(_prisma, prop, receiver);
    return typeof value === "function" ? value.bind(_prisma) : value;
  },
});

export { prisma };
