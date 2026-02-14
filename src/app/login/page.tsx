import { setSessionCookie, signInWithPassword } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/app/login/LoginForm";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export const dynamic = "force-dynamic";

type State = { ok: boolean; formError?: string };

async function signIn(_prev: State, formData: FormData): Promise<State> {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, formError: "Email and password are required." };
  try {
    const result = await signInWithPassword(email, password);
    if (!result.ok) {
      if (result.reason === "not_approved") return { ok: false, formError: "Your account is pending admin approval." };
      if (result.reason === "no_password")
        return { ok: false, formError: "No password is set for this email yet. Please use Sign up to set one." };
      return { ok: false, formError: "Invalid email or password." };
    }
    await setSessionCookie(result.session);
    if (result.user.role === "ADMIN") redirect("/admin");
    if (!result.user.profileCompletedAt) redirect("/signup");
    redirect("/staff/availability");
  } catch (err) {
    // Let Next.js handle redirects (redirect() throws).
    if (isRedirectError(err)) throw err;
    console.error("[Login] Failed to sign in", err);
    return { ok: false, formError: "Something went wrong. Please try again." };
  }
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Brand ambassadors sign in here.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm action={signIn} />
        </CardContent>
      </Card>
    </div>
  );
}

