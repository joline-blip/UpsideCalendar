import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PurgeStaffDialog } from "@/app/admin/danger/PurgeStaffDialog";

export const dynamic = "force-dynamic";

async function purgeAllStaff(formData: FormData) {
  "use server";
  await requireAdmin();

  const confirm = String(formData.get("confirm") ?? "");
  if (confirm.trim().toLowerCase() !== "delete bas") return;

  const staff = await prisma.user.findMany({
    where: { role: "STAFF" },
    select: { id: true },
    take: 10000,
  });
  const staffIds = staff.map((s) => s.id);
  if (staffIds.length === 0) redirect("/admin/danger?done=1&deleted=0");

  const result = await prisma.$transaction(async (tx) => {
    const deletedBookings = await tx.booking.deleteMany({ where: { staffUserId: { in: staffIds } } });
    const deletedAvailability = await tx.availabilityBlock.deleteMany({ where: { userId: { in: staffIds } } });
    const deletedSessions = await tx.session.deleteMany({ where: { userId: { in: staffIds } } });
    const deletedAudit = await tx.auditLog.deleteMany({ where: { actorUserId: { in: staffIds } } });
    const deletedUsers = await tx.user.deleteMany({ where: { id: { in: staffIds } } });
    return {
      deletedBookings: deletedBookings.count,
      deletedAvailability: deletedAvailability.count,
      deletedSessions: deletedSessions.count,
      deletedAudit: deletedAudit.count,
      deletedUsers: deletedUsers.count,
    };
  });

  redirect(
    `/admin/danger?done=1&deleted=${encodeURIComponent(
      String(result.deletedUsers),
    )}&bookings=${encodeURIComponent(String(result.deletedBookings))}`,
  );
}

export default async function AdminDangerPage({
  searchParams,
}: {
  searchParams?: Promise<{ done?: string; deleted?: string; bookings?: string }>;
}) {
  const admin = await requireAdmin();
  const sp = (await searchParams) ?? {};

  const done = sp.done === "1";
  const deleted = sp.deleted ?? "";
  const bookings = sp.bookings ?? "";

  const staffCount = await prisma.user.count({ where: { role: "STAFF" } });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm text-muted-foreground">UpsideCalendar</div>
            <div className="font-medium">Admin • Danger zone</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="underline" href="/admin">
              Admin home
            </Link>
            <Link className="underline" href="/admin/settings">
              Settings
            </Link>
            <div className="text-muted-foreground">{admin.email}</div>
            <form action="/logout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {done ? (
          <div className="rounded-md border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm">
            Deleted <span className="font-medium">{deleted || "0"}</span> BA(s) and{" "}
            <span className="font-medium">{bookings || "0"}</span> booking(s).
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Delete all BAs (STAFF)</CardTitle>
            <CardDescription>
              This permanently deletes all staff users and their related data. Admin accounts are kept.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Current BA count: <span className="font-medium text-foreground">{staffCount}</span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <PurgeStaffDialog staffCount={staffCount} formAction={purgeAllStaff} />
              <div className="text-sm text-muted-foreground">This can’t be undone.</div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
