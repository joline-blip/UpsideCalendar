import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminBasPage() {
  const admin = await requireAdmin();

  const bas = await prisma.user.findMany({
    where: { role: "STAFF" },
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm text-muted-foreground">UpsideCalendar</div>
            <div className="font-medium">Admin • BAs</div>
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

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All brand ambassadors</CardTitle>
            <CardDescription>Row/column view of BA profiles.</CardDescription>
          </CardHeader>
          <CardContent>
            {bas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No BAs yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>First</TableHead>
                    <TableHead>Last</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Markets</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bas.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.firstName ?? ""}</TableCell>
                      <TableCell>{u.lastName ?? ""}</TableCell>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell className="max-w-[420px] whitespace-normal">{u.address ?? ""}</TableCell>
                      <TableCell className="max-w-[240px] whitespace-normal">
                        {u.markets.length ? u.markets.join(", ") : ""}
                      </TableCell>
                      <TableCell>{u.approvedAt ? format(u.approvedAt, "PP") : "pending"}</TableCell>
                      <TableCell>{format(u.createdAt, "PP")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

