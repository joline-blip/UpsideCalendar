import { PrismaClient } from "@/generated/prisma";
import { env } from "@/lib/env";

declare global {
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const { DATABASE_URL } = env();
  return new PrismaClient({
    datasources: {
      db: { url: DATABASE_URL },
    },
  });
}

export const prisma = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalThis.__prisma = prisma;

