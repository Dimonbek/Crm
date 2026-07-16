"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function addLeadNoteAction(
  leadId: string,
  formData: FormData
): Promise<void> {
  const user = await requireUser();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  await prisma.note.create({
    data: { content, leadId, authorId: user.userId, authorName: user.name },
  });
  await prisma.activity.create({
    data: {
      type: "NOTE",
      content: "Izoh qo'shildi",
      leadId,
      userId: user.userId,
    },
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function assignLeadAction(
  leadId: string,
  userId: string
): Promise<void> {
  const me = await requireUser();
  const assignee =
    userId === ""
      ? null
      : await prisma.user.findUnique({ where: { id: userId } });

  await prisma.lead.update({
    where: { id: leadId },
    data: { assignedToId: assignee?.id ?? null },
  });
  await prisma.activity.create({
    data: {
      type: "ASSIGNED",
      content: assignee
        ? `Menejerga tayinlandi: ${assignee.name}`
        : "Tayinlash bekor qilindi",
      leadId,
      userId: me.userId,
    },
  });

  revalidatePath(`/leads/${leadId}`);
}

const convertSchema = z.object({
  title: z.string().trim().min(1, "Sarlavha kiriting"),
  amount: z.coerce.number().min(0).optional(),
});

export type ConvertState = { error?: string };

export async function convertLeadToDealAction(
  leadId: string,
  _prev: ConvertState,
  formData: FormData
): Promise<ConvertState> {
  const me = await requireUser();

  const parsed = convertSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { error: "Lead topilmadi" };
  if (lead.status === "CONVERTED") {
    return { error: "Bu lead allaqachon konvertatsiya qilingan" };
  }

  // Kontakt: telefon bo'yicha bor bo'lsa ulanadi, bo'lmasa yaratiladi
  let contactId = lead.contactId;
  if (!contactId) {
    const contact = await prisma.contact.upsert({
      where: { phone: lead.phone },
      update: {},
      create: { phone: lead.phone },
    });
    contactId = contact.id;
  }

  const deal = await prisma.deal.create({
    data: {
      title: parsed.data.title,
      amount: parsed.data.amount ?? null,
      leadId: lead.id,
      contactId,
      assignedToId: lead.assignedToId,
    },
  });

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "CONVERTED", contactId },
  });

  await prisma.activity.createMany({
    data: [
      {
        type: "CONVERTED",
        content: `Bitimga aylantirildi: ${deal.title}`,
        leadId,
        userId: me.userId,
      },
      {
        type: "CREATED",
        content: "Bitim leaddan yaratildi",
        dealId: deal.id,
        userId: me.userId,
      },
    ],
  });

  revalidatePath("/leads");
  revalidatePath("/deals");
  redirect(`/deals`);
}
