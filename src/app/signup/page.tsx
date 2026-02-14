import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { isAdminEmail, createSessionInDb, setSessionCookie } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "@/app/signup/SignupForm";

export const dynamic = "force-dynamic";

type State = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<
    Record<
      "email" | "firstName" | "lastName" | "address" | "markets" | "password" | "confirmPassword",
      string
    >
  >;
};

async function signUp(_prev: State, formData: FormData): Promise<State> {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const marketsRaw = String(formData.get("markets") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: NonNullable<State["fieldErrors"]> = {};
  if (!email) fieldErrors.email = "Email is required.";
  if (email && !email.includes("@")) fieldErrors.email = "Enter a valid email.";
  if (!firstName) fieldErrors.firstName = "First name is required.";
  if (!lastName) fieldErrors.lastName = "Last name is required.";
  if (!address) fieldErrors.address = "Address is required.";
  if (!password || password.length < 8) fieldErrors.password = "Password must be at least 8 characters.";
  if (!confirmPassword) fieldErrors.confirmPassword = "Please confirm your password.";
  if (password && confirmPassword && password !== confirmPassword) fieldErrors.confirmPassword = "Passwords do not match.";

  if (email && isAdminEmail(email)) {
    fieldErrors.email = "This email is reserved for admin sign-in. Use the admin login page.";
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  const markets = marketsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    return { ok: false, formError: "An account with this email already exists. Please sign in." };
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "STAFF",
      firstName,
      lastName,
      address,
      markets,
      passwordHash,
      profileCompletedAt: new Date(),
    },
    create: {
      email,
      role: "STAFF",
      firstName,
      lastName,
      address,
      markets,
      passwordHash,
      profileCompletedAt: new Date(),
    },
  });

  const session = await createSessionInDb(user.id);
  await setSessionCookie(session);
  redirect("/staff/availability");
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>Brand ambassadors create an account here.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm action={signUp} />
        </CardContent>
      </Card>
    </div>
  );
}
