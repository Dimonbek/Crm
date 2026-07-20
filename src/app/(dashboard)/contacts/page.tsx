import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { formatMoney, timeAgo } from "@/lib/format";
import { AddContactButton } from "./contacts-client";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string }>;
}) {
  const { orgId } = await currentOrg();
  const { q, f } = await searchParams;

  const contacts = await prisma.contact.findMany({
    where: {
      organizationId: orgId,
      ...(q
        ? {
            OR: [
              { phone: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      leads: {
        select: {
          id: true,
          status: true,
          saleAmount: true,
          destination: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Har mijoz uchun tarix ko'rsatkichlari
  const rows = contacts.map((c) => {
    const sold = c.leads.filter((l) => l.status === "CONVERTED");
    return {
      c,
      inquiries: c.leads.length,
      purchases: sold.length,
      spent: sold.reduce((a, l) => a + (l.saleAmount ?? 0), 0),
      last: c.leads[0] ?? null,
      repeat: c.leads.length > 1,
    };
  });

  const filtered = f === "repeat" ? rows.filter((r) => r.repeat) : rows;
  const repeatCount = rows.filter((r) => r.repeat).length;
  const totalSpent = rows.reduce((a, r) => a + r.spent, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mijozlar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Har bir mijozning to&apos;liq tarixi — ma&apos;lumot o&apos;chmaydi
          </p>
        </div>
        <AddContactButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Jami mijozlar" value={String(rows.length)} />
        <Kpi
          label="Takroriy mijozlar"
          value={String(repeatCount)}
          accent="text-success"
          hint="2+ marta murojaat qilgan"
        />
        <Kpi
          label="Jami xaridlar"
          value={formatMoney(totalSpent)}
          accent="text-success"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Ism, telefon yoki email..."
            className="w-64 rounded-lg border border-border bg-muted px-3 py-2 text-sm outline-none transition focus:border-primary"
          />
          {f && <input type="hidden" name="f" value={f} />}
          <button className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
            Qidirish
          </button>
        </form>
        <Chip label="Barchasi" href="/contacts" active={f !== "repeat"} />
        <Chip
          label={`Takroriy (${repeatCount})`}
          href="/contacts?f=repeat"
          active={f === "repeat"}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Mijoz</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Murojaatlar</th>
              <th className="px-4 py-3 font-medium">Xaridlar</th>
              <th className="px-4 py-3 font-medium">Jami to&apos;lagan</th>
              <th className="px-4 py-3 font-medium">Oxirgi so&apos;rov</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Mijoz topilmadi.
                </td>
              </tr>
            )}
            {filtered.map(({ c, inquiries, purchases, spent, last, repeat }) => (
              <tr
                key={c.id}
                className="border-b border-border/60 transition last:border-0 hover:bg-muted/50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/contacts/${c.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {c.name || "Noma'lum"}
                  </Link>
                  {repeat && (
                    <span className="ml-2 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-xs text-success">
                      Takroriy
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3">{inquiries}</td>
                <td className="px-4 py-3">
                  {purchases > 0 ? (
                    <span className="text-success">{purchases}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">
                  {spent > 0 ? formatMoney(spent) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {last ? (
                    <>
                      <div className="text-foreground">{last.destination}</div>
                      <div className="text-xs">{timeAgo(last.createdAt)}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent = "text-foreground",
  hint,
}: {
  label: string;
  value: string;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`mt-2 text-xl font-semibold ${accent}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Chip({
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
