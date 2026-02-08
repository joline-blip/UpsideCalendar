import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDays, addMinutes, format, isAfter, isBefore } from "date-fns";
import { generateSlotsFromBlock } from "@/lib/slots";
import { env } from "@/lib/env";
import { redirect } from "next/navigation";
import Link from "next/link";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

function cutoffHours() {
  return env().AVAILABILITY_CUTOFF_HOURS ?? 24;
}

async function bookSlot(slug: string, formData: FormData) {
  "use server";
  const clientName = String(formData.get("clientName") ?? "").trim();
  const clientEmail = String(formData.get("clientEmail") ?? "").trim().toLowerCase();
  const staffUserId = String(formData.get("staffUserId") ?? "");
  const startAtIso = String(formData.get("startAt") ?? "");

  if (!clientName || !clientEmail || !staffUserId || !startAtIso) return;
  const startAt = new Date(startAtIso);
  if (isNaN(startAt.getTime())) return;

  const eventType = await prisma.eventType.findUnique({ where: { slug } });
  if (!eventType || !eventType.active) return;

  const endAt = addMinutes(startAt, eventType.durationMinutes);
  const cutoff = addMinutes(new Date(), cutoffHours() * 60);
  if (isBefore(startAt, cutoff)) return;

  const booking = await prisma.$transaction(async (tx) => {
    const availability = await tx.availabilityBlock.findFirst({
      where: {
        userId: staffUserId,
        status: "AVAILABLE",
        startAt: { lte: startAt },
        endAt: { gte: endAt },
      },
    });
    if (!availability) throw new Error("Slot unavailable");

    const conflict = await tx.booking.findFirst({
      where: {
        staffUserId,
        status: "BOOKED",
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (conflict) throw new Error("Already booked");

    return tx.booking.create({
      data: {
        eventTypeId: eventType.id,
        staffUserId,
        clientName,
        clientEmail,
        startAt,
        endAt,
        createdBy: "CLIENT",
        lockedAt: new Date(),
      },
    });
  });

  await writeAuditLog({
    actorUserId: null,
    entityType: "booking",
    entityId: booking.id,
    action: "create_client",
    after: booking,
  });

  redirect(`/bookings/${booking.id}`);
}

export default async function PublicBookingPage({
  params,
}: {
  params: { slug: string };
}) {
  const eventType = await prisma.eventType.findUnique({ where: { slug: params.slug } });
  if (!eventType || !eventType.active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not found</CardTitle>
            <CardDescription>This booking page is not available.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const rangeEnd = addDays(now, 14);

  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      status: "AVAILABLE",
      startAt: { lt: rangeEnd },
      endAt: { gt: now },
    },
    orderBy: { startAt: "asc" },
    take: 200,
  });

  const bookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      startAt: { lt: rangeEnd },
      endAt: { gt: now },
    },
    select: { staffUserId: true, startAt: true, endAt: true },
    take: 500,
  });

  const bookedOverlaps = (staffUserId: string, startAt: Date, endAt: Date) =>
    bookings.some(
      (b) =>
        b.staffUserId === staffUserId &&
        isBefore(b.startAt, endAt) &&
        isAfter(b.endAt, startAt),
    );

  const cutoff = addMinutes(now, cutoffHours() * 60);

  const candidateSlots = blocks
    .flatMap((b) =>
      generateSlotsFromBlock({
        staffUserId: b.userId,
        blockStartAt: b.startAt,
        blockEndAt: b.endAt,
        durationMinutes: eventType.durationMinutes,
        stepMinutes: 30,
      }),
    )
    .filter((s) => isAfter(s.startAt, cutoff))
    .filter((s) => !bookedOverlaps(s.staffUserId, s.startAt, s.endAt))
    .slice(0, 20);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="text-sm text-muted-foreground">UpsideCalendar</div>
          <div className="font-medium">{eventType.name}</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Pick a time</CardTitle>
            <CardDescription>Showing the next available slots (MVP).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {candidateSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available slots found in the next 14 days.</p>
            ) : (
              <div className="grid gap-3">
                {candidateSlots.map((s) => (
                  <Card key={`${s.staffUserId}:${s.startAt.toISOString()}`}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-medium">{format(s.startAt, "PPpp")}</div>
                          <div className="text-sm text-muted-foreground">
                            {eventType.durationMinutes} minutes
                          </div>
                        </div>
                        <form action={bookSlot.bind(null, params.slug)} className="grid gap-3 sm:grid-cols-2 sm:items-end">
                          <input type="hidden" name="staffUserId" value={s.staffUserId} />
                          <input type="hidden" name="startAt" value={s.startAt.toISOString()} />
                          <div className="space-y-2">
                            <Label htmlFor={`clientName-${s.startAt.toISOString()}`}>Name</Label>
                            <Input id={`clientName-${s.startAt.toISOString()}`} name="clientName" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`clientEmail-${s.startAt.toISOString()}`}>Email</Label>
                            <Input id={`clientEmail-${s.startAt.toISOString()}`} name="clientEmail" type="email" required />
                          </div>
                          <div className="sm:col-span-2">
                            <Button type="submit" className="w-full">Book</Button>
                          </div>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="text-sm">
              <Link className="underline" href="/">
                Back home
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

