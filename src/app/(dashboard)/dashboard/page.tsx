import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { LEAD_STATUSES, STATUS_LABEL, STATUS_CLASS } from "@/lib/leads";
import { formatDate, formatMoney } from "@/lib/format";
import type { LeadStatus } from "@/generated/prisma/enums";

export default async function DashboardPage() {
  const { orgId, session: user } = await currentOrg();

  const [total, newCount, grouped, recent, activeDeals, openTasks, wonAgg] =
    await Promise.all([
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.lead.count({ where: { organizationId: orgId, status: "NEW" } }),
      prisma.lead.groupBy({
        by: ["status"],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      prisma.lead.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.deal.count({
        where: {
          organizationId: orgId,
          stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
        },
      }),
      prisma.task.count({
        where: { organizationId: orgId, status: { not: "DONE" } },
      }),
      prisma.deal.aggregate({
        where: { organizationId: orgId, stage: "CLOSED_WON" },
        _sum: { amount: true },
      }),
    ]);

  const countByStatus = (s: LeadStatus) =>
    grouped.find((g) => g.status === s)?._count._all ?? 0;

  const kpis = [
    { label: "Yangi leadlar", value: newCount, accent: "text-primary" },
    { label: "Aktiv bitimlar", value: activeDeals, accent: "text-warning" },
    { label: "Ochiq vazifalar", value: openTasks, accent: "text-fg" },
    {
      label: "Yutilgan summa",
      value: formatMoney(wonAgg._sum.amount),
      accent: "text-success",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Salom, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="mt-1 text-sm text-muted">
          Bugungi umumiy holat bilan tanishing
        </p>
      </div>

      {/* KPI kartalari */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <div className="text-sm text-muted">{k.label}</div>
            <div
              className={`mt-2 font-semibold ${k.accent} ${
                typeof k.value === "number" ? "text-3xl" : "text-xl"
              }`}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status taqsimoti */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-medium">Status bo&apos;yicha taqsimot</h2>
          <div className="flex flex-col gap-3">
            {LEAD_STATUSES.map((s) => {
              const count = countByStatus(s);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={s}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_CLASS[s]}`}
                    >
                      {STATUS_LABEL[s]}
                    </span>
                    <span className="text-muted">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Oxirgi leadlar */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Oxirgi leadlar</h2>
            <Link href="/leads" className="text-sm text-primary hover:underline">
              Barchasi →
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-border/60">
            {recent.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">
                Hali lead yo&apos;q
              </p>
            )}
            {recent.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{lead.destination}</div>
                  <div className="text-xs text-muted">{lead.phone}</div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={`rounded-full border px-2 py-0.5 ${STATUS_CLASS[lead.status]}`}
                  >
                    {STATUS_LABEL[lead.status]}
                  </span>
                  <span className="whitespace-nowrap text-muted">
                    {formatDate(lead.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
