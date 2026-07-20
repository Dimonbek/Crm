import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/platform";
import { formatDate, formatMoney } from "@/lib/format";
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin panel</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platformadagi barcha kompaniyalar va ularning botlari
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            ← CRM
          </Link>
          <AddOrgButton />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Kompaniyalar" value={String(orgs.length)} />
        <Kpi label="Jami leadlar" value={String(totalLeads)} />
        <Kpi
          label="Platformadagi sotuvlar"
          value={formatMoney(totalRevenue)}
          accent="text-success"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Kompaniya</th>
              <th className="px-4 py-3 font-medium">Telegram bot</th>
              <th className="px-4 py-3 font-medium">Login</th>
              <th className="px-4 py-3 font-medium">Leadlar</th>
              <th className="px-4 py-3 font-medium">Mijozlar</th>
              <th className="px-4 py-3 font-medium">Sotuv</th>
              <th className="px-4 py-3 font-medium">Yaratilgan</th>
              <th className="px-4 py-3 font-medium">Bot ulash</th>
            </tr>
          </thead>
          <tbody>
            {orgs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  Hali kompaniya yo&apos;q.
                </td>
              </tr>
            )}
            {orgs.map((o) => {
              const sold = o.leads.filter((l) => l.status === "CONVERTED");
              const revenue = sold.reduce((s, l) => s + (l.saleAmount ?? 0), 0);
              const admin = o.users[0];
              const connected = !!o.botUsername;
              return (
                <tr
                  key={o.id}
                  className="border-b border-border/60 transition last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <ViewOrgButton orgId={o.id} orgName={o.name} />
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground">{o.slug}</code>
                      {!connected && (
                        <span className="rounded-full border border-warning/30 bg-warning/15 px-1.5 py-0.5 text-xs text-warning">
                          bot ulanmagan
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <BotCell orgId={o.id} botUsername={o.botUsername} />
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 font-medium">{o.leads.length}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o._count.contacts}</td>
                  <td className="px-4 py-3">
                    {revenue > 0 ? (
                      <span className="text-success">{formatMoney(revenue)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    <div className="text-xs text-muted-foreground">{sold.length} sotuv</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="px-4 py-3">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-medium">Yangi mijozni ulash tartibi</h2>
        <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
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
      </div>
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
