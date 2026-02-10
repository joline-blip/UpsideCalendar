import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function completeProfile(formData: FormData) {
  "use server";
  const user = await requireUser();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const marketsRaw = String(formData.get("markets") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!firstName || !lastName || !address) return;
  if (!password || password.length < 8) return;
  if (password !== confirmPassword) return;

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
          <form action={completeProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (username)</Label>
              <Input id="email" name="email" value={user.email} disabled />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" name="lastName" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" placeholder="Street, City, State ZIP" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="markets">Markets</Label>
              <Input
                id="markets"
                name="markets"
                placeholder="Comma-separated (e.g. Hartford, New Haven, Stamford)"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" minLength={8} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Save and continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

