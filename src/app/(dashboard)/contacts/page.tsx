import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { formatMoney, timeAgo } from "@/lib/format";
import { AddContactButton } from "./contacts-client";
import { PageHeader, StatCard, TableCard, FilterChip } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <PageHeader
        title="Mijozlar"
        description="Har bir mijozning to'liq tarixi — ma'lumot o'chmaydi"
        action={<AddContactButton />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Jami mijozlar" value={rows.length} />
        <StatCard
          label="Takroriy mijozlar"
          value={repeatCount}
          accent="text-success"
          hint="2+ marta murojaat qilgan"
        />
        <StatCard
          label="Jami xaridlar"
          value={formatMoney(totalSpent)}
          accent="text-success"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form className="flex gap-2">
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Ism, telefon yoki email..."
            className="w-64"
          />
          {f && <input type="hidden" name="f" value={f} />}
          <Button type="submit" variant="outline" size="icon">
            <Search className="size-4" />
          </Button>
        </form>
        <FilterChip label="Barchasi" href="/contacts" active={f !== "repeat"} />
        <FilterChip
          label={`Takroriy (${repeatCount})`}
          href="/contacts?f=repeat"
          active={f === "repeat"}
        />
      </div>

      <TableCard>
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow>
              <TableHead>Mijoz</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Murojaatlar</TableHead>
              <TableHead>Xaridlar</TableHead>
              <TableHead>Jami to&apos;lagan</TableHead>
              <TableHead>Oxirgi so&apos;rov</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-32 text-center"
                >
                  Mijoz topilmadi.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(({ c, inquiries, purchases, spent, last, repeat }) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link
                    href={`/contacts/${c.id}`}
                    className="hover:text-primary font-medium"
                  >
                    {c.name || "Noma'lum"}
                  </Link>
                  {repeat && (
                    <Badge
                      variant="outline"
                      className="border-success/30 bg-success/15 text-success ml-2"
                    >
                      Takroriy
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{c.phone}</TableCell>
                <TableCell className="tabular-nums">{inquiries}</TableCell>
                <TableCell className="tabular-nums">
                  {purchases > 0 ? (
                    <span className="text-success">{purchases}</span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="font-medium tabular-nums">
                  {spent > 0 ? (
                    formatMoney(spent)
                  ) : (
                    <span className="text-muted-foreground font-normal">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {last ? (
                    <>
                      <div className="text-foreground">{last.destination}</div>
                      <div className="text-xs">{timeAgo(last.createdAt)}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
}
