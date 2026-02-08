import { prisma } from "@/lib/prisma";
import { createEvent } from "ics";

export const dynamic = "force-dynamic";

function toUtcArray(dt: Date): [number, number, number, number, number] {
  return [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), dt.getUTCHours(), dt.getUTCMinutes()];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { eventType: true, staffUser: true },
  });

  if (!booking) {
    return new Response("Not found", { status: 404 });
  }

  const { error, value } = createEvent({
    uid: booking.id,
    title: booking.eventType.name,
    description: `UpsideCalendar booking\n\nContact: ${booking.clientName} (${booking.clientEmail})\nStaff: ${booking.staffUser.email}\nBooking ID: ${booking.id}`,
    start: toUtcArray(booking.startAt),
    end: toUtcArray(booking.endAt),
    startInputType: "utc",
    endInputType: "utc",
  });

  if (error || !value) {
    return new Response("Failed to generate calendar invite", { status: 500 });
  }

  const filename = `upsidecalendar-booking-${booking.id}.ics`;
  return new Response(value, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}

