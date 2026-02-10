import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { addHours, addDays, isBefore } from "date-fns";
import { prisma } from "@/lib/prisma";
import { env, isProd } from "@/lib/env";
import { randomToken, sha256Hex } from "@/lib/crypto";

const SESSION_COOKIE_NAME = "upside_session";
const MAGIC_LINK_TTL_HOURS = 1;
const SESSION_TTL_DAYS = 30;

function getAdminEmails(): Set<string> {
  const raw = env().ADMIN_EMAILS ?? "";
  const emails = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set(emails);
}

export async function upsertUserByEmail(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const isAdmin = getAdminEmails().has(email);

  return prisma.user.upsert({
    where: { email },
    update: {
      role: isAdmin ? "ADMIN" : undefined,
    },
    create: {
      email,
      role: isAdmin ? "ADMIN" : "STAFF",
    },
  });
}

async function baseUrl() {
  const configured = env().APP_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  // Try to derive from request (works well on Render via proxy headers).
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`.replace(/\/+$/, "");

  // Fallback for local dev
  return "http://localhost:3000";
}

async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  };
}

export async function createMagicLink(email: string) {
  const user = await upsertUserByEmail(email);

  const token = randomToken(32);
  // Hash the raw token only (no secret pepper). The token is already high-entropy,
  // and this avoids "Link not valid" issues caused by environment inconsistencies.
  const tokenHash = sha256Hex(token);
  const expiresAt = addHours(new Date(), MAGIC_LINK_TTL_HOURS);
  const meta = await requestMeta();

  await prisma.magicLink.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  const link = `${await baseUrl()}/invite/${encodeURIComponent(token)}`;
  return { user, link, expiresAt };
}

async function createSession(userId: string) {
  const expiresAt = addDays(new Date(), SESSION_TTL_DAYS);
  const meta = await requestMeta();

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
      ip: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  const c = await cookies();
  c.set({
    name: SESSION_COOKIE_NAME,
    value: session.id,
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });

  return session;
}

export async function signOut() {
  const c = await cookies();
  const sessionId = c.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    await prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  c.delete(SESSION_COOKIE_NAME);
}

export async function consumeMagicLinkToken(token: unknown) {
  if (typeof token !== "string" || !token) {
    return { ok: false as const, reason: "invalid" as const };
  }

  const tokenHash = sha256Hex(token);
  const magic = await prisma.magicLink.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!magic) return { ok: false as const, reason: "invalid" as const };
  if (magic.usedAt) return { ok: false as const, reason: "used" as const };
  if (isBefore(magic.expiresAt, new Date()))
    return { ok: false as const, reason: "expired" as const };

  await prisma.magicLink.update({
    where: { id: magic.id },
    data: { usedAt: new Date() },
  });

  const session = await createSession(magic.userId);
  return { ok: true as const, user: magic.user, session };
}

export async function getCurrentUser() {
  const c = await cookies();
  const sessionId = c.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (isBefore(session.expiresAt, new Date())) {
    c.delete(SESSION_COOKIE_NAME);
    return null;
  }
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/staff/availability");
  return user;
}

