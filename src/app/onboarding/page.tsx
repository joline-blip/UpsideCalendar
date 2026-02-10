import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingForm } from "@/app/onboarding/OnboardingForm";

export const dynamic = "force-dynamic";

type State = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Partial<
    Record<
      "firstName" | "lastName" | "address" | "markets" | "password" | "confirmPassword",
      string
    >
  >;
};

async function completeProfile(prevState: State, formData: FormData): Promise<State> {
  "use server";
  const user = await requireUser();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const marketsRaw = String(formData.get("markets") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const fieldErrors: NonNullable<State["fieldErrors"]> = {};
  if (!firstName) fieldErrors.firstName = "First name is required.";
  if (!lastName) fieldErrors.lastName = "Last name is required.";
  if (!address) fieldErrors.address = "Address is required.";
  if (!password || password.length < 8) fieldErrors.password = "Password must be at least 8 characters.";
  if (!confirmPassword) fieldErrors.confirmPassword = "Please confirm your password.";
  if (password && confirmPassword && password !== confirmPassword) {
    fieldErrors.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const markets = marketsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  const passwordHash = await hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName,
      address,
      markets,
      passwordHash,
      profileCompletedAt: new Date(),
    },
  });

  redirect(user.role === "ADMIN" ? "/admin" : "/staff/availability");
}

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.profileCompletedAt && user.passwordHash) {
    redirect(user.role === "ADMIN" ? "/admin" : "/staff/availability");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Finish setting up your profile</CardTitle>
          <CardDescription>This is a one-time step after your invite.</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm email={user.email} action={completeProfile} />
        </CardContent>
      </Card>
    </div>
  );
}

