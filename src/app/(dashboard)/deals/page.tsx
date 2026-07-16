import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Kanban, type DealCard } from "./kanban";

export default async function DealsPage() {
  await requireUser();

  const [deals, contacts, users] = await Promise.all([
    prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        contact: { select: { name: true, phone: true } },
        assignedTo: { select: { name: true } },
      },
    }),
    prisma.contact.findMany({
      select: { id: true, name: true, phone: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const cards: DealCard[] = deals.map((d) => ({
    id: d.id,
    title: d.title,
    amount: d.amount,
    stage: d.stage,
    contactName: d.contact?.name || d.contact?.phone || null,
    assigneeName: d.assignedTo?.name || null,
  }));

  return (
    <Kanban
      initialDeals={cards}
      contacts={contacts.map((c) => ({
        id: c.id,
        name: c.name || c.phone,
      }))}
      users={users}
    />
  );
}
