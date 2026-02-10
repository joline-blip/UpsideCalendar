import { NextRequest, NextResponse } from "next/server";
import { consumeMagicLinkToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { isProd } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token?: string }> | { token?: string } },
) {
  const { token } = await ctx.params;

  const result = await consumeMagicLinkToken(token);
  if (!result.ok) {
    const url = new URL("/invite-invalid", req.url);
    url.searchParams.set("reason", result.reason);
    return NextResponse.redirect(url);
  }

  const dest = result.user.role === "ADMIN" ? "/admin" : "/staff/availability";
  const url = new URL(dest, req.url);
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

