import { prisma } from "@/lib/prisma";
import { createEvents } from "ics";
import { addDays } from "date-fns";

export const dynamic = "force-dynamic";

function toUtcArray(dt: Date): [number, number, number, number, number] {
  return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), dt.getUTCHours(), dt.getUTCMinutes()];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const user = await prisma.user.findUnique({ where: { calendarToken: token } });
  if (!user) return new Response("Not found", { status: 404 });

  const now = new Date();
  const rangeEnd = addDays(now, 60);

  const bookings = await prisma.booking.findMany({
    where: {
      staffUserId: user.id,
      status: "BOOKED",
      startAt: { lt: rangeEnd },
      endAt: { gt: now },
    },
    include: { eventType: true },
    orderBy: { startAt: "asc" },
    take: 500,
  });

  const events = bookings.map((b) => ({
    uid: b.id,
    title: b.eventType.name,
    description: `UpsideCalendar booking\nBooking ID: ${b.id}`,
    start: toUtcArray(b.startAt),
    end: toUtcArray(b.endAt),
    startInputType: "utc" as const,
    endInputType: "utc" as const,
  }));

  const { error, value } = createEvents(events);
  if (error || !value) return new Response("Failed to generate feed", { status: 500 });

  return new Response(value, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

