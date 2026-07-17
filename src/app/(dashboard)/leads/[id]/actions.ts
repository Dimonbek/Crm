"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";

/** Lead shu kompaniyaga tegishlimi — har amaldan oldin tekshiriladi */
async function ownLead(leadId: string, orgId: string) {
  return prisma.lead.findFirst({
    where: { id: leadId, organizationId: orgId },
  });
}

export async function addLeadNoteAction(
  leadId: string,
  formData: FormData
): Promise<void> {
  const { orgId, session } = await currentOrg();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;
  if (!(await ownLead(leadId, orgId))) return;

  await prisma.note.create({
    data: {
      content,
      leadId,
      authorId: session.userId,
      authorName: session.name,
      organizationId: orgId,
    },
  });
  await prisma.activity.create({
    data: {
      type: "NOTE",
      content: "Izoh qo'shildi",
      leadId,
      userId: session.userId,
      organizationId: orgId,
    },
  });

  revalidatePath(`/leads/${leadId}`);
}

export async function assignLeadAction(
  leadId: string,
  userId: string
): Promise<void> {
  const { orgId, session } = await currentOrg();
  if (!(await ownLead(leadId, orgId))) return;

  // Faqat shu kompaniya xodimiga tayinlash mumkin
  const assignee =
    userId === ""
      ? null
      : await prisma.user.findFirst({
          where: { id: userId, organizationId: orgId },
        });

  await prisma.lead.updateMany({
    where: { id: leadId, organizationId: orgId },
    data: { assignedToId: assignee?.id ?? null },
  });
  await prisma.activity.create({
    data: {
      type: "ASSIGNED",
      content: assignee
        ? `Menejerga tayinlandi: ${assignee.name}`
        : "Tayinlash bekor qilindi",
      leadId,
      userId: session.userId,
      organizationId: orgId,
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
  const { orgId, session } = await currentOrg();

  const parsed = convertSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const lead = await ownLead(leadId, orgId);
  if (!lead) return { error: "Lead topilmadi" };
  if (lead.status === "CONVERTED") {
    return { error: "Bu lead allaqachon konvertatsiya qilingan" };
  }

  // Kontakt: shu kompaniya ichida telefon bo'yicha bor bo'lsa ulanadi
  let contactId = lead.contactId;
  if (!contactId) {
    const contact = await prisma.contact.upsert({
      where: { organizationId_phone: { organizationId: orgId, phone: lead.phone } },
      update: {},
      create: { phone: lead.phone, organizationId: orgId },
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
      organizationId: orgId,
    },
  });

  await prisma.lead.updateMany({
    where: { id: leadId, organizationId: orgId },
    data: { status: "CONVERTED", contactId },
  });

  await prisma.activity.createMany({
    data: [
      {
        type: "CONVERTED",
        content: `Bitimga aylantirildi: ${deal.title}`,
        leadId,
        userId: session.userId,
        organizationId: orgId,
      },
      {
        type: "CREATED",
        content: "Bitim leaddan yaratildi",
        dealId: deal.id,
        userId: session.userId,
        organizationId: orgId,
      },
    ],
  });

  revalidatePath("/leads");
  revalidatePath("/deals");
  redirect(`/deals`);
}
