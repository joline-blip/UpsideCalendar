import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSessionInDb, isAdminEmail, setSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSignupForm } from "@/app/admin/signup/AdminSignupForm";

export const dynamic = "force-dynamic";

type State = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirmPassword", string>>;
};

async function setAdminPassword(_prev: State, formData: FormData): Promise<State> {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: NonNullable<State["fieldErrors"]> = {};
  if (!email) fieldErrors.email = "Email is required.";
  if (email && !isAdminEmail(email)) fieldErrors.email = "This email is not allowed as an admin.";
  if (!password || password.length < 8) fieldErrors.password = "Password must be at least 8 characters.";
  if (!confirmPassword) fieldErrors.confirmPassword = "Please confirm your password.";
  if (password && confirmPassword && password !== confirmPassword) fieldErrors.confirmPassword = "Passwords do not match.";
  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      passwordHash,
      profileCompletedAt: new Date(),
    },
    create: {
      email,
      role: "ADMIN",
      passwordHash,
      profileCompletedAt: new Date(),
    },
  });

  const session = await createSessionInDb(user.id);
  await setSessionCookie(session);
  redirect("/admin");
}

export default function AdminSignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up admin password</CardTitle>
          <CardDescription>Only emails listed in `ADMIN_EMAILS` are allowed.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminSignupForm action={setAdminPassword} />
        </CardContent>
      </Card>
    </div>
  );
}

