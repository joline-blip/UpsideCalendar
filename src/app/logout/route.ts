import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function publicBaseUrl(req: NextRequest) {
  const configured = (process.env.APP_BASE_URL ?? "").trim();
  if (configured) return configured.replace(/\/+$/, "");

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}`.replace(/\/+$/, "");

  return req.nextUrl.origin.replace(/\/+$/, "");
}

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  const base = publicBaseUrl(req);
  const referer = req.headers.get("referer") ?? "";
  const dest = referer.includes("/admin") ? "/admin/login" : "/login";

  const res = NextResponse.redirect(new URL(dest, base));
  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return res;
}

