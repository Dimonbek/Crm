import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { LEAD_STATUSES, STATUS_LABEL, formatDate } from "@/lib/leads";
import type { LeadStatus } from "@/generated/prisma/enums";
import { AddLeadButton, StatusSelect, DeleteLeadButton } from "./leads-client";
import Link from "next/link";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { orgId } = await currentOrg();
  const { q, status } = await searchParams;

  const statusFilter =
    status && LEAD_STATUSES.includes(status as LeadStatus)
      ? (status as LeadStatus)
      : undefined;

  const leads = await prisma.lead.findMany({
    where: {
      organizationId: orgId,
      status: statusFilter,
      ...(q
        ? {
            OR: [
              { phone: { contains: q, mode: "insensitive" } },
              { destination: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Leadlar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jami {leads.length} ta lead
          </p>
        </div>
        <AddLeadButton />
      </div>

      {/* Filtrlar */}
      <div className="flex flex-wrap items-center gap-2">
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Telefon yoki manzil bo'yicha qidirish..."
            className="w-64 rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none transition focus:border-primary"
          />
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <button className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
            Qidirish
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip label="Barchasi" href={buildHref(q, undefined)} active={!statusFilter} />
          {LEAD_STATUSES.map((s) => (
            <FilterChip
              key={s}
              label={STATUS_LABEL[s]}
              href={buildHref(q, s)}
              active={statusFilter === s}
            />
          ))}
        </div>
      </div>

      {/* Jadval */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Manzil</th>
              <th className="px-4 py-3 font-medium">Sana</th>
              <th className="px-4 py-3 font-medium">Kishi</th>
              <th className="px-4 py-3 font-medium">Vaqt</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Yaratilgan</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  Lead topilmadi. &quot;+ Yangi lead&quot; tugmasi orqali
                  qo&apos;shing.
                </td>
              </tr>
            )}
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-border/60 transition last:border-0 hover:bg-muted/50"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="hover:text-primary"
                  >
                    {lead.phone}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="hover:text-primary"
                  >
                    {lead.destination}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(lead.travelDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{lead.travelers}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {lead.contactTime ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusSelect
                    leadId={lead.id}
                    status={lead.status}
                    saleAmount={lead.saleAmount}
                  />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(lead.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <DeleteLeadButton leadId={lead.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildHref(q: string | undefined, status: LeadStatus | undefined) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  const s = params.toString();
  return s ? `/leads?${s}` : "/leads";
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-primary/40 bg-primary/15 text-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
