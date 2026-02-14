import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { addDays, isBefore } from "date-fns";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";

export const SESSION_COOKIE_NAME = "upside_session";
const SESSION_TTL_DAYS = 30;

function getAdminEmails(): Set<string> {
  const raw = env().ADMIN_EMAILS ?? "";
  const emails = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set(emails);
}

export function isAdminEmail(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  return getAdminEmails().has(email);
}

async function requestMeta() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  };
}

export async function createSessionInDb(userId: string) {
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

  return session;
}

export async function setSessionCookie(session: { id: string; expiresAt: Date }) {
  const c = await cookies();
  c.set({
    name: SESSION_COOKIE_NAME,
    value: session.id,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });
}

export async function signInWithPassword(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return { ok: false as const };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false as const };

  if (user.role === "STAFF" && !user.approvedAt) {
    return { ok: false as const, reason: "not_approved" as const };
  }

  const session = await createSessionInDb(user.id);
  return { ok: true as const, user, session };
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
  if (user.role === "STAFF" && !user.approvedAt) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  // Keep admin and BA flows separate: non-admins should go to admin login,
  // not the BA login page.
  if (user.role !== "ADMIN") redirect("/admin/login");
  return user;
}

