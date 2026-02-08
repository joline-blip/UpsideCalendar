import { consumeMagicLinkToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function InviteTokenPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const result = await consumeMagicLinkToken(token);

  if (result.ok) {
    if (result.user.role === "ADMIN") redirect("/admin");
    redirect("/staff/availability");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Link not valid</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This sign-in link is {result.reason}. Please request a new one.
          </p>
          <div className="mt-4">
            <a className="text-sm underline" href="/login">
              Back to sign in
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

