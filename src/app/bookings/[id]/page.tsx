import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { googleCalendarUrl, yahooCalendarUrl } from "@/lib/calendar";

export const dynamic = "force-dynamic";

export default async function BookingConfirmationPage({
  params,
}: {
  params: { id: string };
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { eventType: true, staffUser: true },
  });

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not found</CardTitle>
            <CardDescription>This booking doesn’t exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Booked</CardTitle>
          <CardDescription>Confirmation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">Event</div>
          <div className="font-medium">{booking.eventType.name}</div>
          <div className="text-sm text-muted-foreground mt-4">When</div>
          <div className="font-medium">
            {format(booking.startAt, "PPpp")} → {format(booking.endAt, "PPpp")}
          </div>
          <div className="text-sm text-muted-foreground mt-4">Assigned staff</div>
          <div className="font-medium">{booking.staffUser.email}</div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <a
              href={googleCalendarUrl({
                title: booking.eventType.name,
                startAt: booking.startAt,
                endAt: booking.endAt,
                details: `Booking ID: ${booking.id}`,
              })}
              target="_blank"
              rel="noreferrer"
            >
              <Button type="button" className="w-full" variant="secondary">
                Google
              </Button>
            </a>
            <a
              href={yahooCalendarUrl({
                title: booking.eventType.name,
                startAt: booking.startAt,
                endAt: booking.endAt,
                details: `Booking ID: ${booking.id}`,
              })}
              target="_blank"
              rel="noreferrer"
            >
              <Button type="button" className="w-full" variant="secondary">
                Yahoo
              </Button>
            </a>
            <Link href={`/bookings/${booking.id}/ics`}>
              <Button type="button" className="w-full">
                Download .ics
              </Button>
            </Link>
          </div>
          <div className="text-sm mt-6">
            <Link className="underline" href="/">
              Back home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

