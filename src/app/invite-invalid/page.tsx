import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function InviteInvalidPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }> | { reason?: string };
}) {
  const sp = await searchParams;
  const reason = sp.reason ?? "invalid";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Link not valid</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This sign-in link is {reason}. Please request a new one.
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

