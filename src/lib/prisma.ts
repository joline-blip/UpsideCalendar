import { PrismaClient } from "@/generated/prisma";
import { env } from "@/lib/env";

declare global {
  var __prisma: PrismaClient | undefined;
}

let _client: PrismaClient | undefined = globalThis.__prisma;

function getClient(): PrismaClient {
  if (_client) return _client;
  const { DATABASE_URL } = env();
  _client = new PrismaClient({
    datasources: {
      db: { url: DATABASE_URL },
    },
  });
  if (process.env.NODE_ENV !== "production") globalThis.__prisma = _client;
  return _client;
}

// Lazy proxy so importing modules doesn't crash at load time if env is misconfigured.
// Any actual DB access will still throw, but inside the calling context (e.g. server action).
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as PrismaClient;

