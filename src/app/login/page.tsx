import { setSessionCookie, signInWithPassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function signIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return;
  try {
    const result = await signInWithPassword(email, password);
    if (!result.ok) return;
    await setSessionCookie(result.session);
    if (result.user.role === "STAFF" && !result.user.profileCompletedAt) redirect("/onboarding");
    redirect(result.user.role === "ADMIN" ? "/admin" : "/staff/availability");
  } catch (err) {
    console.error("[Login] Failed to sign in", err);
    return;
  }
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use your email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@company.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            <p className="text-sm text-muted-foreground">
              First time here? Use the invite link the admin emailed you to set up your profile and password.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

