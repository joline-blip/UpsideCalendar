import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { addDays, addMinutes, format, isAfter, isBefore } from "date-fns";
import Link from "next/link";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function createAdminBooking(formData: FormData) {
  "use server";
  const admin = await requireAdmin();

  const eventTypeId = String(formData.get("eventTypeId") ?? "");
  const staffUserId = String(formData.get("staffUserId") ?? "");
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim().toLowerCase();
  const startAt = new Date(String(formData.get("startAt") ?? ""));
  const endAt = new Date(String(formData.get("endAt") ?? ""));

  if (!eventTypeId || !staffUserId || !clientName || !clientEmail) return;
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) return;
  if (!isAfter(endAt, startAt)) return;

  const eventType = await prisma.eventType.findUnique({ where: { id: eventTypeId } });
  if (!eventType || !eventType.active) return;

  // If admin provides an end time, trust it, but enforce minimum duration.
  const minEndAt = addMinutes(startAt, eventType.durationMinutes);
  const finalEndAt = isBefore(endAt, minEndAt) ? minEndAt : endAt;

  const booking = await prisma.$transaction(async (tx) => {
    const availability = await tx.availabilityBlock.findFirst({
      where: {
        userId: staffUserId,
        status: "AVAILABLE",
        startAt: { lte: startAt },
        endAt: { gte: finalEndAt },
      },
    });
    if (!availability) throw new Error("Not within availability");

    const conflict = await tx.booking.findFirst({
      where: {
        staffUserId,
        status: "BOOKED",
        startAt: { lt: finalEndAt },
        endAt: { gt: startAt },
      },
    });
    if (conflict) throw new Error("Conflict");

    return tx.booking.create({
      data: {
        eventTypeId,
        staffUserId,
        clientName,
        clientEmail,
        startAt,
        endAt: finalEndAt,
        createdBy: "ADMIN",
        createdByUserId: admin.id,
        lockedAt: new Date(),
      },
    });
  });

  await writeAuditLog({
    actorUserId: admin.id,
    entityType: "booking",
    entityId: booking.id,
    action: "create_admin",
    after: booking,
  });
}

export default async function AdminSchedulePage() {
  await requireAdmin();

  const now = new Date();
  const rangeEnd = addDays(now, 14);

  const [staff, eventTypes, blocks, bookings] = await Promise.all([
    prisma.user.findMany({
      where: { role: "STAFF" },
      orderBy: { email: "asc" },
      take: 200,
    }),
    prisma.eventType.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.availabilityBlock.findMany({
      where: { status: "AVAILABLE", startAt: { lt: rangeEnd }, endAt: { gt: now } },
      orderBy: [{ userId: "asc" }, { startAt: "asc" }],
      take: 500,
    }),
    prisma.booking.findMany({
      where: { status: "BOOKED", startAt: { lt: rangeEnd }, endAt: { gt: now } },
      orderBy: [{ staffUserId: "asc" }, { startAt: "asc" }],
      take: 500,
    }),
  ]);

  const staffById = new Map(staff.map((s) => [s.id, s]));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm text-muted-foreground">UpsideCalendar</div>
            <div className="font-medium">Admin schedule</div>
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
            <CardTitle>Create booking (admin)</CardTitle>
            <CardDescription>Creates a locked booking (blue) if it fits within availability.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createAdminBooking} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Event type</Label>
                <select name="eventTypeId" className="h-10 w-full rounded-md border bg-background px-3 text-sm" required>
                  <option value="" />
                  {eventTypes.map((et) => (
                    <option key={et.id} value={et.id}>
                      {et.name} ({et.durationMinutes}m)
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Staff</Label>
                <select name="staffUserId" className="h-10 w-full rounded-md border bg-background px-3 text-sm" required>
                  <option value="" />
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Contact name</Label>
                <Input id="clientName" name="clientName" placeholder="Client / brand / event" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Contact email</Label>
                <Input id="clientEmail" name="clientEmail" type="email" placeholder="contact@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startAt">Start</Label>
                <Input id="startAt" name="startAt" type="datetime-local" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endAt">End</Label>
                <Input id="endAt" name="endAt" type="datetime-local" required />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Create booking</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Availability + bookings (next 14 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {blocks.length === 0 && bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              <div className="space-y-8">
                {[...new Set([...blocks.map((b) => b.userId), ...bookings.map((b) => b.staffUserId)])].map((staffId) => {
                  const s = staffById.get(staffId);
                  const staffBlocks = blocks.filter((b) => b.userId === staffId);
                  const staffBookings = bookings.filter((b) => b.staffUserId === staffId);
                  if (!s) return null;
                  return (
                    <div key={staffId} className="space-y-3">
                      <div className="font-medium">{s.email}</div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border p-4">
                          <div className="text-sm font-medium">Availability</div>
                          <Separator className="my-3" />
                          {staffBlocks.length === 0 ? (
                            <div className="text-sm text-muted-foreground">None</div>
                          ) : (
                            <ul className="space-y-2 text-sm">
                              {staffBlocks.map((b) => (
                                <li key={b.id}>
                                  <span className="text-muted-foreground">Burnt orange:</span>{" "}
                                  {format(b.startAt, "PPpp")} → {format(b.endAt, "PPpp")}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="rounded-lg border p-4">
                          <div className="text-sm font-medium">Bookings</div>
                          <Separator className="my-3" />
                          {staffBookings.length === 0 ? (
                            <div className="text-sm text-muted-foreground">None</div>
                          ) : (
                            <ul className="space-y-2 text-sm">
                              {staffBookings.map((b) => (
                                <li key={b.id}>
                                  <span className="text-muted-foreground">Blue:</span>{" "}
                                  {format(b.startAt, "PPpp")} → {format(b.endAt, "PPpp")}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

