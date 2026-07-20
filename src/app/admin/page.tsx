import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/platform";
import { formatDate, formatMoney } from "@/lib/format";
import { PageHeader, StatCard, TableCard } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AddOrgButton,
  BotCell,
  BotEnvButton,
  RegenerateButton,
  ResetPasswordButton,
  ViewOrgButton,
  DeleteOrgButton,
} from "./admin-client";

export default async function AdminPage() {
  await requirePlatformAdmin();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const webhookUrl = `${proto}://${host}/api/webhook`;

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { role: "ADMIN" },
        select: { id: true, email: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      leads: { select: { status: true, saleAmount: true } },
      _count: { select: { users: true, contacts: true } },
    },
  });

  const totalLeads = orgs.reduce((a, o) => a + o.leads.length, 0);
  const totalRevenue = orgs.reduce(
    (a, o) =>
      a +
      o.leads
        .filter((l) => l.status === "CONVERTED")
        .reduce((s, l) => s + (l.saleAmount ?? 0), 0),
    0
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <PageHeader
        title="Admin panel"
        description="Platformadagi barcha kompaniyalar va ularning botlari"
        action={
          <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            ← CRM
          </Link>
            <AddOrgButton />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Kompaniyalar" value={orgs.length} />
        <StatCard label="Jami leadlar" value={totalLeads} />
        <StatCard
          label="Platformadagi sotuvlar"
          value={formatMoney(totalRevenue)}
          accent="text-success"
        />
      </div>

      <TableCard>
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow>
              <TableHead>Kompaniya</TableHead>
              <TableHead>Telegram bot</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Leadlar</TableHead>
              <TableHead>Mijozlar</TableHead>
              <TableHead>Sotuv</TableHead>
              <TableHead>Yaratilgan</TableHead>
              <TableHead>Bot ulash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-muted-foreground h-32 text-center">
                  Hali kompaniya yo&apos;q.
                </TableCell>
              </TableRow>
            )}
            {orgs.map((o) => {
              const sold = o.leads.filter((l) => l.status === "CONVERTED");
              const revenue = sold.reduce((s, l) => s + (l.saleAmount ?? 0), 0);
              const admin = o.users[0];
              const connected = !!o.botUsername;
              return (
                <TableRow key={o.id}>
                  <TableCell>
                    <ViewOrgButton orgId={o.id} orgName={o.name} />
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground">{o.slug}</code>
                      {!connected && (
                        <Badge variant="outline" className="border-warning/30 bg-warning/15 text-warning">
                          bot ulanmagan
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <BotCell orgId={o.id} botUsername={o.botUsername} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {admin?.email ?? "—"}
                      </span>
                      {admin && (
                        <ResetPasswordButton
                          userId={admin.id}
                          email={admin.email}
                        />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o._count.users} xodim
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{o.leads.length}</TableCell>
                  <TableCell className="text-muted-foreground">{o._count.contacts}</TableCell>
                  <TableCell>
                    {revenue > 0 ? (
                      <span className="text-success">{formatMoney(revenue)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    <div className="text-xs text-muted-foreground">{sold.length} sotuv</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <BotEnvButton
                        orgName={o.name}
                        webhookUrl={webhookUrl}
                        token={o.webhookToken}
                      />
                      <RegenerateButton orgId={o.id} />
                      <DeleteOrgButton
                        orgId={o.id}
                        orgName={o.name}
                        leadCount={o.leads.length}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableCard>

      <Card>
        <CardHeader>
          <CardTitle>Yangi mijozni ulash tartibi</CardTitle>
        </CardHeader>
        <CardContent>
        <ol className=" flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
          <li>
            <b className="text-foreground">+ Yangi kompaniya</b> — mijoz nomi, login va
            parolni kiritasiz (mijoz ro&apos;yxatdan o&apos;tishi shart emas)
          </li>
          <li>
            <b className="text-foreground">🔑 Bot sozlamasi</b> — 2 qatorni nusxalab,
            botning Railway <b className="text-foreground">Variables</b> bo&apos;limiga
            qo&apos;yasiz
          </li>
          <li>Bot qayta ishga tushadi — leadlar shu kompaniyaga tusha boshlaydi</li>
          <li>Mijozga login/parolni berasiz — u faqat o&apos;z ma&apos;lumotini ko&apos;radi</li>
        </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent = "text-foreground",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
