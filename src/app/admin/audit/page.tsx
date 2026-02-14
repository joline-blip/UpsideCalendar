import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams?: Promise<{ entityId?: string; entityType?: string }>;
}) {
  await requireAdmin();
  const sp = (await searchParams) ?? {};
  const entityId = sp.entityId?.trim();
  const entityType = sp.entityType?.trim();

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(entityId ? { entityId } : {}),
      ...(entityType ? { entityType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm text-muted-foreground">UpsideCalendar</div>
            <div className="font-medium">Audit log</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="underline" href="/admin">
              Admin home
            </Link>
            <Link className="underline" href="/admin/bookings">
              Bookings
            </Link>
            <form action="/logout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entityType">Entity type</Label>
                <Input id="entityType" name="entityType" defaultValue={entityType ?? ""} placeholder="booking" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entityId">Entity id</Label>
                <Input id="entityId" name="entityId" defaultValue={entityId ?? ""} placeholder="cuid..." />
              </div>
              <div className="md:col-span-2 text-sm text-muted-foreground">
                Submit reloads the page with query params.
              </div>
              <div className="md:col-span-2">
                <Button type="submit" variant="secondary">
                  Apply
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit events.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((l) => (
                  <div key={l.id} className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">
                      {format(l.createdAt, "PPpp")}
                    </div>
                    <div className="font-medium">
                      {l.entityType} • {l.action}
                    </div>
                    <div className="text-sm text-muted-foreground break-all">
                      entityId: {l.entityId} {l.actorUserId ? `• actor: ${l.actorUserId}` : "• actor: public"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

