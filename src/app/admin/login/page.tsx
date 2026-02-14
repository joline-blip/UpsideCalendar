import { signInWithPassword, setSessionCookie } from "@/lib/auth";
import { isAdminEmail } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/PasswordInput";

export const dynamic = "force-dynamic";

async function signIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return;

  // Only allow admin login for emails explicitly listed in ADMIN_EMAILS.
  if (!isAdminEmail(email)) return;

  const result = await signInWithPassword(email, password);
  if (!result.ok) return;
  if (result.user.role !== "ADMIN") return;

  await setSessionCookie(result.session);
  redirect("/admin");
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin sign in</CardTitle>
          <CardDescription>Admins sign in here.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" name="password" required />
            </div>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
            <p className="text-sm">
              <a className="underline" href="/admin/signup">
                Set up admin password
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

