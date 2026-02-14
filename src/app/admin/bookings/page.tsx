import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { addDays, format, isAfter } from "date-fns";
import Link from "next/link";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function cancelBooking(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const cancelReason = String(formData.get("cancelReason") ?? "").trim();
  if (!id) return;

  const before = await prisma.booking.findUnique({ where: { id } });
  if (!before) return;

  const after = await prisma.booking.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: cancelReason || "Cancelled by admin",
    },
  });

  await writeAuditLog({
    actorUserId: admin.id,
    entityType: "booking",
    entityId: id,
    action: "cancel",
    before,
    after,
  });
}

async function rescheduleBooking(formData: FormData) {
  "use server";
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const startAt = new Date(String(formData.get("startAt") ?? ""));
  const endAt = new Date(String(formData.get("endAt") ?? ""));
  if (!id) return;
  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) return;
  if (!isAfter(endAt, startAt)) return;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.status !== "BOOKED") return;

  const after = await prisma.$transaction(async (tx) => {
    const availability = await tx.availabilityBlock.findFirst({
      where: {
        userId: booking.staffUserId,
        status: "AVAILABLE",
        startAt: { lte: startAt },
        endAt: { gte: endAt },
      },
    });
    if (!availability) throw new Error("Not within availability");

    const conflict = await tx.booking.findFirst({
      where: {
        id: { not: booking.id },
        staffUserId: booking.staffUserId,
        status: "BOOKED",
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (conflict) throw new Error("Conflict");

    return tx.booking.update({
      where: { id: booking.id },
      data: { startAt, endAt, lockedAt: new Date() },
    });
  });

  await writeAuditLog({
    actorUserId: admin.id,
    entityType: "booking",
    entityId: booking.id,
    action: "reschedule",
    before: booking,
    after,
  });
}

async function reassignBooking(formData: FormData) {
  "use server";
  const admin = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const staffUserId = String(formData.get("staffUserId") ?? "");
  if (!id || !staffUserId) return;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.status !== "BOOKED") return;

  const after = await prisma.$transaction(async (tx) => {
    const availability = await tx.availabilityBlock.findFirst({
      where: {
        userId: staffUserId,
        status: "AVAILABLE",
        startAt: { lte: booking.startAt },
        endAt: { gte: booking.endAt },
      },
    });
    if (!availability) throw new Error("Not within availability");

    const conflict = await tx.booking.findFirst({
      where: {
        staffUserId,
        status: "BOOKED",
        startAt: { lt: booking.endAt },
        endAt: { gt: booking.startAt },
      },
    });
    if (conflict) throw new Error("Conflict");

    return tx.booking.update({
      where: { id: booking.id },
      data: { staffUserId, lockedAt: new Date() },
    });
  });

  await writeAuditLog({
    actorUserId: admin.id,
    entityType: "booking",
    entityId: booking.id,
    action: "reassign",
    before: booking,
    after,
  });
}

export default async function AdminBookingsPage() {
  await requireAdmin();
  const now = new Date();
  const rangeEnd = addDays(now, 30);

  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    orderBy: { email: "asc" },
    take: 200,
  });

  const bookings = await prisma.booking.findMany({
    where: { startAt: { lt: rangeEnd }, endAt: { gt: now } },
    orderBy: { startAt: "asc" },
    include: { eventType: true, staffUser: true },
    take: 200,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm text-muted-foreground">UpsideCalendar</div>
            <div className="font-medium">Bookings</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="underline" href="/admin">
              Admin home
            </Link>
            <Link className="underline" href="/admin/schedule">
              Schedule
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/logout">Log out</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming (next 30 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">
                          {b.eventType.name} • {b.staffUser.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(b.startAt, "PPpp")} → {format(b.endAt, "PPpp")} • {b.status}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Contact: {b.clientName} ({b.clientEmail})
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 md:items-end">
                        {b.status === "BOOKED" ? (
                          <form action={cancelBooking} className="flex gap-2">
                            <input type="hidden" name="id" value={b.id} />
                            <Input name="cancelReason" placeholder="Cancel reason" />
                            <Button type="submit" variant="secondary">
                              Cancel
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>

                    {b.status === "BOOKED" ? (
                      <>
                        <Separator className="my-4" />
                        <div className="grid gap-4 md:grid-cols-2">
                          <form action={rescheduleBooking} className="grid gap-3 md:grid-cols-3 md:items-end">
                            <input type="hidden" name="id" value={b.id} />
                            <div className="space-y-2">
                              <Label>New start</Label>
                              <Input name="startAt" type="datetime-local" required />
                            </div>
                            <div className="space-y-2">
                              <Label>New end</Label>
                              <Input name="endAt" type="datetime-local" required />
                            </div>
                            <Button type="submit">Reschedule</Button>
                          </form>

                          <form action={reassignBooking} className="grid gap-3 md:grid-cols-2 md:items-end">
                            <input type="hidden" name="id" value={b.id} />
                            <div className="space-y-2">
                              <Label>Reassign staff</Label>
                              <select
                                name="staffUserId"
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                defaultValue={b.staffUserId}
                              >
                                {staff.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.email}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Button type="submit" variant="secondary">
                              Reassign
                            </Button>
                          </form>
                        </div>
                      </>
                    ) : null}
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

