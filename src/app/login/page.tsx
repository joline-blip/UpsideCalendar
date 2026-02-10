import { createMagicLink } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function requestLink(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  try {
    const { link } = await createMagicLink(email);
    await sendMagicLinkEmail(email, link);
  } catch (err) {
    // Prevent an app-level error page if email/db/env is misconfigured.
    console.error("[Login] Failed to create/send magic link", err);
    return;
  }
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>We’ll email you a magic link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={requestLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@company.com" required />
            </div>
            <Button type="submit" className="w-full">
              Email me a link
            </Button>
            <p className="text-sm text-muted-foreground">
              If email isn’t configured yet, the link will be printed in the server logs in development.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

