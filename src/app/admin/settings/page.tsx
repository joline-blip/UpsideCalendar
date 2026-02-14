import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppConfig, setBaSignupMode } from "@/lib/config";
import { writeAuditLog } from "@/lib/audit";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

async function updateSignupMode(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const mode = String(formData.get("baSignupMode") ?? "");
  if (mode !== "OPEN" && mode !== "ADMIN_APPROVAL" && mode !== "DISABLED") return;

  const updated = await setBaSignupMode(mode as any);
  await writeAuditLog({
    actorUserId: admin.id,
    entityType: "app_config",
    entityId: updated.id,
    action: "set_ba_signup_mode",
    after: { baSignupMode: updated.baSignupMode },
  });

  redirect("/admin/settings?saved=1");
}

async function approveStaff(formData: FormData) {
  "use server";
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  const before = await prisma.user.findUnique({ where: { id: userId } });
  if (!before || before.role !== "STAFF") return;

  const after = await prisma.user.update({
    where: { id: userId },
    data: { approvedAt: new Date(), approvedByAdminId: admin.id },
  });

  await writeAuditLog({
    actorUserId: admin.id,
    entityType: "user",
    entityId: after.id,
    action: "approve_staff",
    before: { approvedAt: before.approvedAt, approvedByAdminId: before.approvedByAdminId },
    after: { approvedAt: after.approvedAt, approvedByAdminId: after.approvedByAdminId },
  });

  redirect("/admin/settings");
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>;
}) {
  const admin = await requireAdmin();
  const sp = (await searchParams) ?? {};
  const saved = sp.saved === "1";

  const config = await getAppConfig();
  const pending = await prisma.user.findMany({
    where: { role: "STAFF", approvedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm text-muted-foreground">UpsideCalendar</div>
            <div className="font-medium">Admin • Settings</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="underline" href="/admin">
              Admin home
            </Link>
            <div className="text-muted-foreground">{admin.email}</div>
            <Button asChild variant="outline" size="sm">
              <Link href="/logout">Log out</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {saved ? (
          <div className="rounded-md border border-emerald-600/30 bg-emerald-600/10 px-4 py-3 text-sm">
            Saved.
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>BA signup policy</CardTitle>
            <CardDescription>Control whether brand ambassadors can create accounts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={updateSignupMode} className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="baSignupMode" value="OPEN" defaultChecked={config.baSignupMode === "OPEN"} />
                <span>
                  <span className="font-medium">Open</span> — signups are immediately approved
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="baSignupMode"
                  value="ADMIN_APPROVAL"
                  defaultChecked={config.baSignupMode === "ADMIN_APPROVAL"}
                />
                <span>
                  <span className="font-medium">Require admin approval</span> — signups are pending until approved
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="baSignupMode"
                  value="DISABLED"
                  defaultChecked={config.baSignupMode === "DISABLED"}
                />
                <span>
                  <span className="font-medium">Disabled</span> — no one can sign up
                </span>
              </label>

              <Button type="submit">Save</Button>
            </form>
            <Separator />
            <div className="text-sm">
              <Link className="underline" href="/admin/danger">
                Danger zone (purge BAs)
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending BA approvals</CardTitle>
            <CardDescription>Approve new BAs so they can sign in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending BAs.</p>
            ) : (
              <div className="space-y-2">
                {pending.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="text-sm">
                      <div className="font-medium">{u.email}</div>
                      <div className="text-muted-foreground">
                        {u.firstName ?? ""} {u.lastName ?? ""} • Created {u.createdAt.toLocaleString()}
                      </div>
                    </div>
                    <form action={approveStaff}>
                      <input type="hidden" name="userId" value={u.id} />
                      <Button type="submit" size="sm">
                        Approve
                      </Button>
                    </form>
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

