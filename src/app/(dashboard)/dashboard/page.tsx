import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { LEAD_STATUSES, STATUS_LABEL, STATUS_CLASS } from "@/lib/leads";
import { formatDate, formatMoney } from "@/lib/format";
import type { LeadStatus } from "@/generated/prisma/enums";
import { StatCard, FilterChip } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeadsChart, type ChartPoint } from "./leads-chart";

/** Kun boshiga keltirish (mahalliy vaqt) */
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const MONTHS = [
  "yan", "fev", "mar", "apr", "may", "iyn",
  "iyl", "avg", "sen", "okt", "noy", "dek",
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { orgId, session: user } = await currentOrg();
  const { period } = await searchParams;

  // Davr: 7 yoki 30 kun (standart — 7)
  const days = period === "30" ? 30 : 7;
  const since = startOfDay(new Date());
  since.setDate(since.getDate() - (days - 1));

  const [total, newCount, grouped, recent, activeDeals, openTasks, wonAgg, periodLeads] =
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
      // Daromad — sotilgan lidlar summasidan (Sotildi)
      prisma.lead.aggregate({
        where: { organizationId: orgId, status: "CONVERTED" },
        _sum: { saleAmount: true },
      }),
      // Grafik uchun: davr ichidagi leadlar
      prisma.lead.findMany({
        where: { organizationId: orgId, createdAt: { gte: since } },
        select: { createdAt: true, status: true },
      }),
    ]);

  // Kunlar bo'yicha guruhlash
  const buckets = new Map<string, ChartPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, {
      label: `${d.getDate()}-${MONTHS[d.getMonth()]}`,
      leads: 0,
      sales: 0,
    });
  }
  for (const l of periodLeads) {
    const key = startOfDay(l.createdAt).toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    b.leads += 1;
    if (l.status === "CONVERTED") b.sales += 1;
  }
  const chartData = [...buckets.values()];

  const countByStatus = (s: LeadStatus) =>
    grouped.find((g) => g.status === s)?._count._all ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Salom, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Bugungi umumiy holat bilan tanishing
        </p>
      </div>

      {/* KPI kartalari */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Yangi leadlar" value={newCount} />
        <StatCard label="Aktiv bitimlar" value={activeDeals} />
        <StatCard label="Ochiq vazifalar" value={openTasks} />
        <StatCard
          label="Sotuv summasi"
          value={formatMoney(wonAgg._sum.saleAmount)}
          accent="text-success"
        />
      </div>

      {/* Dinamika grafigi */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-end gap-2">
          <FilterChip
            label="7 kun"
            href="/dashboard"
            active={days === 7}
          />
          <FilterChip
            label="30 kun"
            href="/dashboard?period=30"
            active={days === 30}
          />
        </div>
        <LeadsChart
          data={chartData}
          title="Leadlar dinamikasi"
          description={`Oxirgi ${days} kun — kelgan leadlar va sotuvlar`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Status taqsimoti */}
        <Card>
          <CardHeader>
            <CardTitle>Status bo&apos;yicha taqsimot</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {LEAD_STATUSES.map((s) => {
              const count = countByStatus(s);
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={s}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <Badge variant="outline" className={STATUS_CLASS[s]}>
                      {STATUS_LABEL[s]}
                    </Badge>
                    <span className="text-muted-foreground tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="bg-muted h-2 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Oxirgi leadlar */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Oxirgi leadlar</CardTitle>
            <Link
              href="/leads"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Barchasi →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-border/60 flex flex-col divide-y">
              {recent.length === 0 && (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Hali lead yo&apos;q
                </p>
              )}
              {recent.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {lead.destination}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {lead.phone}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={STATUS_CLASS[lead.status]}>
                      {STATUS_LABEL[lead.status]}
                    </Badge>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(lead.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
