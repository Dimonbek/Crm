import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { computeMetrics, verdict, deepLink, TONE_CLASS } from "@/lib/campaigns";
import {
  AddCampaignButton,
  BudgetCell,
  CopyLink,
  CampaignRowActions,
  BotUsernameForm,
} from "./campaigns-client";

export default async function CampaignsPage() {
  const { orgId } = await currentOrg();

  const [org, campaigns] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { botUsername: true },
    }),
    prisma.campaign.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { leads: true } } },
    }),
  ]);

  // Sotilgan lidlarni kampaniya bo'yicha yig'amiz (status=Sotildi, saleAmount)
  const soldLeads = await prisma.lead.findMany({
    where: {
      organizationId: orgId,
      status: "CONVERTED",
      campaignId: { not: null },
    },
    select: { campaignId: true, saleAmount: true },
  });

  const salesByCampaign = new Map<string, { count: number; revenue: number }>();
  for (const l of soldLeads) {
    const cid = l.campaignId;
    if (!cid) continue;
    const cur = salesByCampaign.get(cid) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += l.saleAmount ?? 0;
    salesByCampaign.set(cid, cur);
  }

  const rows = campaigns.map((c) => {
    const s = salesByCampaign.get(c.id) ?? { count: 0, revenue: 0 };
    const m = computeMetrics(c.budget, c._count.leads, s.count, s.revenue);
    return { c, m, v: verdict(m, c.budget) };
  });

  // Umumiy yig'indi
  const totals = rows.reduce(
    (a, r) => ({
      budget: a.budget + r.c.budget,
      leads: a.leads + r.m.leads,
      sales: a.sales + r.m.sales,
      revenue: a.revenue + r.m.revenue,
    }),
    { budget: 0, leads: 0, sales: 0, revenue: 0 }
  );
  const totalM = computeMetrics(
    totals.budget,
    totals.leads,
    totals.sales,
    totals.revenue
  );

  // Kampaniyasiz leadlar (deep-link ishlatilmagan)
  const noCampaign = await prisma.lead.count({
    where: { organizationId: orgId, campaignId: null },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reklama kampaniyalari</h1>
          <p className="mt-1 text-sm text-muted">
            Qaysi reklama foyda, qaysi zarar keltirayotganini ko&apos;ring
          </p>
        </div>
        <AddCampaignButton />
      </div>

      {/* Umumiy KPI */}
      {rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Sarflangan" value={formatMoney(totals.budget)} />
          <Kpi
            label="1 lead narxi (o'rtacha)"
            value={totalM.cpl != null ? formatMoney(totalM.cpl) : "—"}
          />
          <Kpi
            label="Daromad"
            value={formatMoney(totals.revenue)}
            accent="text-success"
          />
          <Kpi
            label="Sof foyda"
            value={formatMoney(totalM.profit)}
            accent={totalM.profit >= 0 ? "text-success" : "text-danger"}
            hint={totalM.roi != null ? `ROI ${totalM.roi.toFixed(0)}%` : undefined}
          />
        </div>
      )}

      {/* Jadval */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Kampaniya</th>
              <th className="px-4 py-3 font-medium">Byudjet</th>
              <th className="px-4 py-3 font-medium">Leadlar</th>
              <th className="px-4 py-3 font-medium">1 lead narxi</th>
              <th className="px-4 py-3 font-medium">Sotuv</th>
              <th className="px-4 py-3 font-medium">1 mijoz narxi</th>
              <th className="px-4 py-3 font-medium">Daromad</th>
              <th className="px-4 py-3 font-medium">Foyda</th>
              <th className="px-4 py-3 font-medium">Xulosa</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-muted">
                  Hali kampaniya yo&apos;q. Reklama berishdan oldin kampaniya
                  yarating — shunda qaysi reklama pul keltirganini bilasiz.
                </td>
              </tr>
            )}
            {rows.map(({ c, m, v }) => {
              const link = deepLink(org?.botUsername ?? null, c.code);
              return (
                <tr
                  key={c.id}
                  className="border-b border-border/60 transition last:border-0 hover:bg-surface-2/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <code className="text-xs text-muted">{c.code}</code>
                      {c.channel && (
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-muted">
                          {c.channel}
                        </span>
                      )}
                      {link && <CopyLink link={link} />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <BudgetCell campaignId={c.id} budget={c.budget} />
                  </td>
                  <td className="px-4 py-3 font-medium">{m.leads}</td>
                  <td className="px-4 py-3 text-muted">
                    {m.cpl != null ? formatMoney(m.cpl) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {m.sales}
                    {m.conversion != null && m.leads > 0 && (
                      <span className="ml-1.5 text-xs text-muted">
                        ({m.conversion.toFixed(0)}%)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {m.cac != null ? formatMoney(m.cac) : "—"}
                  </td>
                  <td className="px-4 py-3 text-success">
                    {m.revenue > 0 ? formatMoney(m.revenue) : "—"}
                  </td>
                  <td
                    className={`px-4 py-3 font-medium ${
                      c.budget === 0
                        ? "text-muted"
                        : m.profit >= 0
                          ? "text-success"
                          : "text-danger"
                    }`}
                  >
                    {c.budget === 0 && m.revenue === 0
                      ? "—"
                      : formatMoney(m.profit)}
                    {m.roi != null && (
                      <div className="text-xs font-normal text-muted">
                        ROI {m.roi.toFixed(0)}%
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${TONE_CLASS[v.tone]}`}
                    >
                      {v.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <CampaignRowActions campaignId={c.id} active={c.active} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-surface-2/40 font-medium">
                <td className="px-4 py-3">Jami</td>
                <td className="px-4 py-3">{formatMoney(totals.budget)}</td>
                <td className="px-4 py-3">{totals.leads}</td>
                <td className="px-4 py-3 text-muted">
                  {totalM.cpl != null ? formatMoney(totalM.cpl) : "—"}
                </td>
                <td className="px-4 py-3">{totals.sales}</td>
                <td className="px-4 py-3 text-muted">
                  {totalM.cac != null ? formatMoney(totalM.cac) : "—"}
                </td>
                <td className="px-4 py-3 text-success">
                  {formatMoney(totals.revenue)}
                </td>
                <td
                  className={`px-4 py-3 ${totalM.profit >= 0 ? "text-success" : "text-danger"}`}
                >
                  {formatMoney(totalM.profit)}
                </td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {noCampaign > 0 && (
        <p className="text-sm text-muted">
          <b className="text-fg">{noCampaign}</b> ta lead kampaniyasiz kelgan —
          ular reklama havolasisiz (to&apos;g&apos;ridan-to&apos;g&apos;ri botga)
          yozgan.
        </p>
      )}

      {/* Sozlash */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-medium">Reklama havolalarini yasash</h2>
        <p className="mt-1 text-sm text-muted">
          Bot username&apos;ini kiriting — har bir kampaniya uchun tayyor havola
          olasiz.
        </p>
        <div className="mt-4">
          <BotUsernameForm current={org?.botUsername ?? null} />
        </div>

        <div className="mt-6 rounded-lg border border-border bg-surface-2 p-4">
          <div className="text-sm font-medium">Qanday ishlaydi</div>
          <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted">
            <li>
              Har bir reklama uchun alohida kampaniya yarating (masalan
              &quot;Instagram iyul&quot;)
            </li>
            <li>
              Uning <b className="text-fg">havolasini</b> nusxalab, reklamaga
              qo&apos;ying — Instagram bio, story, post
            </li>
            <li>
              Mijoz havolani bosib botga kirsa, lead{" "}
              <b className="text-fg">avtomatik shu kampaniyaga</b> bog&apos;lanadi
            </li>
            <li>
              Reklamaga sarflagan pulingizni <b className="text-fg">Byudjet</b>{" "}
              ustuniga yozing — qolganini CRM hisoblaydi
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent = "text-fg",
  hint,
}: {
  label: string;
  value: string;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${accent}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
