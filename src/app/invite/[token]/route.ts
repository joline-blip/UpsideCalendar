import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLinkToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { isProd } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicBaseUrl(req: NextRequest) {
  const configured = (process.env.APP_BASE_URL ?? "").trim();
  if (configured) return configured.replace(/\/+$/, "");

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}`.replace(/\/+$/, "");

  return req.nextUrl.origin.replace(/\/+$/, "");
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token?: string }> | { token?: string } },
) {
  const { token } = await ctx.params;
  const base = publicBaseUrl(req);

  const result = await consumeMagicLinkToken(token);
  if (!result.ok) {
    const url = new URL("/invite-invalid", base);
    url.searchParams.set("reason", result.reason);
    return NextResponse.redirect(url);
  }

  const dest =
    result.user.role === "STAFF" && !result.user.profileCompletedAt ? "/onboarding" : result.user.role === "ADMIN" ? "/admin" : "/staff/availability";
  const url = new URL(dest, base);
  const res = NextResponse.redirect(url);

  res.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: result.session.id,
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    expires: result.session.expiresAt,
  });

  return res;
}

