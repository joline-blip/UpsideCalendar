import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { addHours, format } from "date-fns";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { writeAuditLog } from "@/lib/audit";
import { AvailabilityPicker } from "@/app/staff/availability/AvailabilityPicker";

export const dynamic = "force-dynamic";

function cutoffHours() {
  return env().AVAILABILITY_CUTOFF_HOURS ?? 24;
}

function canEdit(startAt: Date) {
  return startAt.getTime() > addHours(new Date(), cutoffHours()).getTime();
}

function isHalfHourIncrement(d: Date) {
  return d.getSeconds() === 0 && d.getMilliseconds() === 0 && d.getMinutes() % 30 === 0;
}

async function createAvailability(formData: FormData) {
  "use server";
  const user = await requireUser();
  const startMsRaw = String(formData.get("startAtMs") ?? "");
  const endMsRaw = String(formData.get("endAtMs") ?? "");
  const startMs = Number(startMsRaw);
  const endMs = Number(endMsRaw);
  const startAt = new Date(startMs);
  const endAt = new Date(endMs);

  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) {
    console.warn("[Availability] Invalid dates", { userId: user.id, startMsRaw, endMsRaw });
    redirect("/staff/availability?msg=invalid_dates");
  }
  const now = new Date();
  if (startAt < now || endAt < now) {
    redirect("/staff/availability?msg=past_not_allowed");
  }
  if (endAt <= startAt) {
    redirect("/staff/availability?msg=end_before_start");
  }
  if (!isHalfHourIncrement(startAt) || !isHalfHourIncrement(endAt)) {
    redirect("/staff/availability?msg=half_hour_only");
  }

  try {
    const block = await prisma.availabilityBlock.create({
      data: {
        userId: user.id,
        startAt,
        endAt,
      },
    });

    await writeAuditLog({
      actorUserId: user.id,
      entityType: "availability_block",
      entityId: block.id,
      action: "create",
      after: block,
    });
  } catch (err) {
    console.error("[Availability] Failed to create block", { userId: user.id, startMsRaw, endMsRaw, err });
    redirect("/staff/availability?msg=save_failed");
  }

  // Force a fresh render after mutation.
  redirect("/staff/availability?msg=saved");
}

async function deleteAvailability(formData: FormData) {
  "use server";
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const block = await prisma.availabilityBlock.findUnique({ where: { id } });
  if (!block || block.userId !== user.id) return;
  if (!canEdit(block.startAt)) return;

  await prisma.availabilityBlock.delete({ where: { id } });

  await writeAuditLog({
    actorUserId: user.id,
    entityType: "availability_block",
    entityId: id,
    action: "delete",
    before: block,
  });

  redirect("/staff/availability?msg=deleted");
}

export default async function StaffAvailabilityPage({
  searchParams,
}: {
  searchParams?: Promise<{ msg?: string }>;
}) {
  const user = await requireUser();
  if (!user.profileCompletedAt) redirect("/signup");
  const sp = (await searchParams) ?? {};
  const msg = sp.msg ?? "";

  const blocks = await prisma.availabilityBlock.findMany({
    where: { userId: user.id },
    orderBy: { startAt: "asc" },
    take: 100,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm text-muted-foreground">UpsideCalendar</div>
            <div className="font-medium">Availability</div>
          </div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {msg ? (
          <div className="rounded-md border px-4 py-3 text-sm">
            {msg === "saved"
              ? "Availability saved."
              : msg === "deleted"
                ? "Availability deleted."
                : msg === "invalid_dates"
                  ? "Please enter a valid start and end time."
                  : msg === "past_not_allowed"
                    ? "Availability cannot be set in the past."
                    : msg === "half_hour_only"
                      ? "Please use 30-minute increments (e.g. 1:00, 1:30, 2:00)."
                  : msg === "end_before_start"
                    ? "End time must be after the start time."
                    : "Could not save. Please try again."}
          </div>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Add availability</CardTitle>
          </CardHeader>
          <CardContent>
            <AvailabilityPicker action={createAvailability} />
            <p className="mt-3 text-sm text-muted-foreground">
              You can edit/delete availability until {cutoffHours()} hours before the start time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your availability blocks</CardTitle>
          </CardHeader>
          <CardContent>
            {blocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No availability yet.</p>
            ) : (
              <div className="space-y-3">
                {blocks.map((b) => (
                  <div key={b.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium">
                          {format(b.startAt, "PPpp")} → {format(b.endAt, "PPpp")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Status: {b.status}
                          {!canEdit(b.startAt) ? " (locked by cutoff)" : ""}
                        </div>
                      </div>
                      <form action={deleteAvailability}>
                        <input type="hidden" name="id" value={b.id} />
                        <Button type="submit" variant="secondary" disabled={!canEdit(b.startAt)}>
                          Delete
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Separator className="my-6" />
            <div className="text-sm">
              <div className="text-muted-foreground">Calendar subscription feed (bookings only):</div>
              <div className="mt-1">
                <Link className="underline" href={`/cal/${user.calendarToken}`}>
                  /cal/{user.calendarToken}
                </Link>
              </div>
              <div className="mt-4">
              <Link className="underline" href="/">
                Back home
              </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

