import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { AddContactButton, DeleteContactButton } from "./contacts-client";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireUser();
  const { q } = await searchParams;

  const contacts = await prisma.contact.findMany({
    where: q
      ? {
          OR: [
            { phone: { contains: q } },
            { name: { contains: q } },
            { email: { contains: q } },
          ],
        }
      : {},
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true, deals: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kontaktlar</h1>
          <p className="mt-1 text-sm text-muted">
            Jami {contacts.length} ta kontakt
          </p>
        </div>
        <AddContactButton />
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Ism, telefon yoki email bo'yicha qidirish..."
          className="w-72 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition focus:border-primary"
        />
        <button className="rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-fg">
          Qidirish
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-medium">Ism</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Leadlar</th>
              <th className="px-4 py-3 font-medium">Bitimlar</th>
              <th className="px-4 py-3 font-medium">Qo&apos;shilgan</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted">
                  Kontakt topilmadi.
                </td>
              </tr>
            )}
            {contacts.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border/60 transition last:border-0 hover:bg-surface-2/50"
              >
                <td className="px-4 py-3 font-medium">
                  <Link href={`/contacts/${c.id}`} className="hover:text-primary">
                    {c.name || "Noma'lum"}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3 text-muted">{c.email || "—"}</td>
                <td className="px-4 py-3 text-muted">{c._count.leads}</td>
                <td className="px-4 py-3 text-muted">{c._count.deals}</td>
                <td className="px-4 py-3 text-muted">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <DeleteContactButton contactId={c.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
