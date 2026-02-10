import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeError(err: unknown) {
  if (err instanceof Error) return { name: err.name, message: err.message };
  return { name: "UnknownError", message: String(err) };
}

function redactUrl(raw: string | undefined) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return {
      protocol: u.protocol,
      host: u.host,
      pathname: u.pathname,
    };
  } catch {
    return { invalid: true };
  }
}

export async function GET() {
  const envSnapshot = {
    NODE_ENV: process.env.NODE_ENV ?? null,
    APP_BASE_URL: redactUrl(process.env.APP_BASE_URL),
    has_DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DATABASE_URL: redactUrl(process.env.DATABASE_URL),
    has_RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    has_EMAIL_FROM: Boolean(process.env.EMAIL_FROM),
    EMAIL_FROM: process.env.EMAIL_FROM ?? null,
  };

  const checks: Record<string, unknown> = {};

  // DB connectivity (no secrets returned)
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.db = { ok: true };
  } catch (err) {
    checks.db = { ok: false, error: safeError(err) };
  }

  return NextResponse.json(
    {
      ok: (checks.db as { ok: boolean }).ok === true,
      env: envSnapshot,
      checks,
      now: new Date().toISOString(),
    },
    { status: (checks.db as { ok: boolean }).ok === true ? 200 : 500 },
  );
}

