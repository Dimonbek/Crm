import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { formatDate, formatMoney, timeAgo } from "@/lib/format";
import { STATUS_LABEL, STATUS_CLASS } from "@/lib/leads";
import { EditContactButton } from "../contacts-client";

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
      leads: {
        orderBy: { createdAt: "desc" },
        include: { campaign: { select: { name: true } } },
      },
      deals: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!contact) notFound();

  const sold = contact.leads.filter((l) => l.status === "CONVERTED");
  const spent = sold.reduce((a, l) => a + (l.saleAmount ?? 0), 0);
  const isRepeat = contact.leads.length > 1;
  const first = contact.leads[contact.leads.length - 1];
  const last = contact.leads[0];
  const avgCheck = sold.length > 0 ? spent / sold.length : 0;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/contacts" className="text-sm text-muted-foreground hover:text-foreground">
        ← Mijozlar
      </Link>

      {/* Sarlavha */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold">
              {(contact.name || contact.phone).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">
                  {contact.name || "Noma'lum mijoz"}
                </h1>
                {isRepeat && (
                  <span className="rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs text-success">
                    Takroriy mijoz · {contact.leads.length} marta
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {contact.phone}
                {contact.email ? ` · ${contact.email}` : ""}
              </p>
            </div>
          </div>
          <EditContactButton
            contactId={contact.id}
            name={contact.name}
            email={contact.email}
            notes={contact.notes}
          />
        </div>

        {contact.notes && (
          <div className="mt-5 rounded-lg border border-border bg-muted p-4">
            <div className="text-xs text-muted-foreground">Eslatma</div>
            <div className="mt-1 whitespace-pre-wrap text-sm">{contact.notes}</div>
          </div>
        )}
      </div>

      {/* Mijoz qiymati */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Murojaatlar" value={String(contact.leads.length)} />
        <Kpi
          label="Xaridlar"
          value={String(sold.length)}
          accent={sold.length > 0 ? "text-success" : "text-muted-foreground"}
        />
        <Kpi
          label="Jami to'lagan"
          value={formatMoney(spent)}
          accent="text-success"
        />
        <Kpi
          label="O'rtacha xarid"
          value={avgCheck > 0 ? formatMoney(avgCheck) : "—"}
        />
      </div>

      {/* Sayohat tarixi */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-medium">Sayohat tarixi</h2>
          <span className="text-xs text-muted-foreground">
            {first && `Birinchi murojaat: ${formatDate(first.createdAt)}`}
          </span>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Mijoz qayerga so&apos;ragan va nima sotib olgan — hammasi saqlanadi
        </p>

        {contact.leads.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Hali murojaat yo&apos;q</p>
        ) : (
          <div className="relative flex flex-col">
            {contact.leads.map((lead, i) => {
              const isSold = lead.status === "CONVERTED";
              return (
                <div key={lead.id} className="flex gap-4">
                  {/* chiziq */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${
                        isSold ? "bg-success" : "bg-border"
                      }`}
                    />
                    {i < contact.leads.length - 1 && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>

                  <Link
                    href={`/leads/${lead.id}`}
                    className="mb-5 flex-1 rounded-xl border border-border bg-muted/50 p-4 transition hover:border-primary/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{lead.destination}</span>
                      <div className="flex items-center gap-2">
                        {isSold && lead.saleAmount != null && (
                          <span className="font-medium text-success">
                            {formatMoney(lead.saleAmount)}
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_CLASS[lead.status]}`}
                        >
                          {STATUS_LABEL[lead.status]}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatDate(lead.createdAt)}</span>
                      <span>· {lead.travelers} kishi</span>
                      {lead.travelDateText && <span>· {lead.travelDateText}</span>}
                      {lead.campaign && <span>· {lead.campaign.name}</span>}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bitimlar (Kanban) */}
      {contact.deals.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-medium">
            Kanbanдagi bitimlar ({contact.deals.length})
          </h2>
          <div className="flex flex-col divide-y divide-border/60">
            {contact.deals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <div className="font-medium">{deal.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {timeAgo(deal.createdAt)}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatMoney(deal.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {last && (
        <p className="text-sm text-muted-foreground">
          Oxirgi faoliyat: {timeAgo(last.createdAt)}
        </p>
      )}
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
      <div className={`mt-2 text-lg font-semibold ${accent}`}>{value}</div>
    </div>
  );
}
