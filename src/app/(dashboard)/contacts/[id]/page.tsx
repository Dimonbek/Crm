import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { STATUS_LABEL, STATUS_CLASS } from "@/lib/leads";
import { STAGE_LABEL } from "@/lib/deals";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { orgId } = await currentOrg();
  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, organizationId: orgId },
    include: {
      leads: { orderBy: { createdAt: "desc" } },
      deals: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!contact) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/contacts" className="text-sm text-muted hover:text-fg">
        ← Kontaktlar
      </Link>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-lg font-semibold">
            {(contact.name || contact.phone).slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">
              {contact.name || "Noma'lum kontakt"}
            </h1>
            <p className="text-sm text-muted">{contact.phone}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoRow label="Email" value={contact.email || "—"} />
          <InfoRow label="Qo'shilgan" value={formatDate(contact.createdAt)} />
          {contact.notes && (
            <div className="sm:col-span-2">
              <div className="text-xs text-muted">Eslatma</div>
              <div className="mt-1 text-sm">{contact.notes}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-medium">Leadlar ({contact.leads.length})</h2>
          <div className="flex flex-col divide-y divide-border/60">
            {contact.leads.length === 0 && (
              <p className="py-4 text-sm text-muted">Lead yo&apos;q</p>
            )}
            {contact.leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
              >
                <div>
                  <div className="font-medium">{lead.destination}</div>
                  <div className="text-xs text-muted">
                    {formatDate(lead.createdAt)}
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_CLASS[lead.status]}`}
                >
                  {STATUS_LABEL[lead.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-medium">Bitimlar ({contact.deals.length})</h2>
          <div className="flex flex-col divide-y divide-border/60">
            {contact.deals.length === 0 && (
              <p className="py-4 text-sm text-muted">Bitim yo&apos;q</p>
            )}
            {contact.deals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <div className="font-medium">{deal.title}</div>
                  <div className="text-xs text-muted">
                    {STAGE_LABEL[deal.stage]}
                  </div>
                </div>
                <span className="text-sm text-muted">
                  {formatMoney(deal.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
