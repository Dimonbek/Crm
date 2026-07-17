import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { formatDate, formatDateTime, timeAgo } from "@/lib/format";
import { StatusSelect } from "../leads-client";
import { AssignSelect, NoteForm, ConvertButton } from "./lead-detail-client";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { orgId } = await currentOrg();
  const { id } = await params;

  const [lead, users] = await Promise.all([
    // findFirst + organizationId — begona lead ochilmaydi (404 beradi)
    prisma.lead.findFirst({
      where: { id, organizationId: orgId },
      include: {
        assignedTo: true,
        contact: true,
        notes: { orderBy: { createdAt: "desc" } },
        activities: { orderBy: { createdAt: "desc" }, take: 30 },
        deal: true,
      },
    }),
    prisma.user.findMany({
      where: { active: true, organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!lead) notFound();

  const isConverted = lead.status === "CONVERTED";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/leads" className="text-sm text-muted hover:text-fg">
          ← Leadlar
        </Link>
        <ConvertButton
          leadId={lead.id}
          disabled={isConverted}
          defaultTitle={`${lead.destination} — ${lead.phone}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chap: ma'lumot */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold">{lead.destination}</h1>
              <StatusSelect leadId={lead.id} status={lead.status} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Telefon" value={lead.phone} />
              <Info
                label="Sayohat sanasi"
                value={
                  lead.travelDate
                    ? formatDate(lead.travelDate)
                    : lead.travelDateText || "—"
                }
              />
              <Info label="Necha kishi" value={String(lead.travelers)} />
              <Info label="Bog'lanish vaqti" value={lead.contactTime || "—"} />
              <Info label="Manba" value={lead.source} />
              <Info label="Yaratilgan" value={formatDate(lead.createdAt)} />
              {lead.contact && (
                <div>
                  <div className="text-xs text-muted">Kontakt</div>
                  <Link
                    href={`/contacts/${lead.contact.id}`}
                    className="mt-1 block text-sm text-primary hover:underline"
                  >
                    {lead.contact.name || lead.contact.phone}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Izohlar */}
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 font-medium">Izohlar ({lead.notes.length})</h2>
            <NoteForm leadId={lead.id} />
            <div className="mt-4 flex flex-col divide-y divide-border/60">
              {lead.notes.length === 0 && (
                <p className="py-3 text-sm text-muted">Hali izoh yo&apos;q</p>
              )}
              {lead.notes.map((note) => (
                <div key={note.id} className="py-3">
                  <div className="text-sm">{note.content}</div>
                  <div className="mt-1 text-xs text-muted">
                    {note.authorName ?? "Tizim"} · {timeAgo(note.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* O'ng: tayinlash + faoliyat */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-3 font-medium">Mas&apos;ul menejer</h2>
            <AssignSelect
              leadId={lead.id}
              assignedToId={lead.assignedToId}
              users={users}
            />
            {isConverted && lead.deal && (
              <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                ✓ Bitimga aylantirilgan: {lead.deal.title}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 font-medium">Faoliyat tarixi</h2>
            <div className="flex flex-col gap-4">
              {lead.activities.length === 0 && (
                <p className="text-sm text-muted">Faoliyat yo&apos;q</p>
              )}
              {lead.activities.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="text-sm">{a.content}</div>
                    <div className="text-xs text-muted">
                      {formatDateTime(a.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
