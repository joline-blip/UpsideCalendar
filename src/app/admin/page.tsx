import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { writeAuditLog } from "@/lib/audit";
import { getAppConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

async function createEventType(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? 60);
  const bufferMinutes = Number(formData.get("bufferMinutes") ?? 0);
  if (!name || !slug) return;

  const eventType = await prisma.eventType.create({
    data: {
      name,
      slug,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : 60,
      bufferMinutes: Number.isFinite(bufferMinutes) ? bufferMinutes : 0,
    },
  });

  await writeAuditLog({
    actorUserId: admin.id,
    entityType: "event_type",
    entityId: eventType.id,
    action: "create",
    after: eventType,
  });
}

export default async function AdminHomePage() {
  const admin = await requireAdmin();
  const config = await getAppConfig();

  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pendingCount = await prisma.user.count({ where: { role: "STAFF", approvedAt: null } });

  const eventTypes = await prisma.eventType.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm text-muted-foreground">UpsideCalendar</div>
            <div className="font-medium">Admin</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="underline" href="/admin/schedule">
              Schedule
            </Link>
            <Link className="underline" href="/admin/bookings">
              Bookings
            </Link>
            <Link className="underline" href="/admin/audit">
              Audit
            </Link>
            <Link className="underline" href="/admin/settings">
              Settings{pendingCount ? ` (${pendingCount} pending)` : ""}
            </Link>
            <div className="text-muted-foreground">{admin.email}</div>
            <Button asChild variant="outline" size="sm">
              <Link href="/logout">Log out</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staff</CardTitle>
            <CardDescription>
              Brand ambassadors who have signed up. Signup policy: <span className="font-medium">{config.baSignupMode}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm font-medium">Recent staff</div>
              {staff.length === 0 ? (
                <p className="text-sm text-muted-foreground">No staff yet.</p>
              ) : (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {staff.map((u) => (
                    <li key={u.id}>
                      {u.email}{" "}
                      {u.approvedAt ? (
                        <span className="text-emerald-700">• approved</span>
                      ) : (
                        <span className="text-amber-700">• pending</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event types</CardTitle>
            <CardDescription>Public booking pages use these.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createEventType} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Brand ambassador shift" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" placeholder="ba-shift" required />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="durationMinutes">Duration (min)</Label>
                  <Input id="durationMinutes" name="durationMinutes" type="number" defaultValue={60} min={15} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bufferMinutes">Buffer (min)</Label>
                  <Input id="bufferMinutes" name="bufferMinutes" type="number" defaultValue={0} min={0} />
                </div>
              </div>
              <Button type="submit">Create</Button>
            </form>

            <Separator className="my-6" />
            <div className="space-y-2">
              <div className="text-sm font-medium">Existing event types</div>
              {eventTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No event types yet.</p>
              ) : (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {eventTypes.map((et) => (
                    <li key={et.id}>
                      <span className="font-medium text-foreground">{et.name}</span>{" "}
                      <span className="text-muted-foreground">({et.slug})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 text-sm">
          <Link className="underline" href="/">
            Back home
          </Link>
        </div>
      </main>
    </div>
  );
}

