"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { LEAD_STATUSES, STATUS_LABEL } from "@/lib/leads";
import type { LeadStatus } from "@/generated/prisma/enums";

const createSchema = z.object({
  phone: z.string().trim().min(3, "Telefon raqamini kiriting"),
  destination: z.string().trim().min(1, "Manzilni kiriting"),
  travelDate: z.string().trim().optional(),
  travelers: z.coerce.number().int().min(1).default(1),
  contactTime: z.string().trim().optional(),
});

export type CreateLeadState = { error?: string; ok?: boolean };

export async function createLeadAction(
  _prev: CreateLeadState,
  formData: FormData
): Promise<CreateLeadState> {
  const { orgId } = await currentOrg();

  const parsed = createSchema.safeParse({
    phone: formData.get("phone"),
    destination: formData.get("destination"),
    travelDate: formData.get("travelDate"),
    travelers: formData.get("travelers"),
    contactTime: formData.get("contactTime"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { phone, destination, travelDate, travelers, contactTime } =
    parsed.data;

  // Har bir lead kontaktga bog'lanadi — mijoz tarixi shu orqali to'planadi
  const contact = await prisma.contact.upsert({
    where: { organizationId_phone: { organizationId: orgId, phone } },
    update: {},
    create: { phone, organizationId: orgId },
  });

  const lead = await prisma.lead.create({
    data: {
      phone,
      destination,
      travelDate: travelDate ? new Date(travelDate) : null,
      travelers,
      contactTime: contactTime || null,
      source: "manual",
      organizationId: orgId,
      contactId: contact.id,
    },
  });

  await prisma.activity.create({
    data: {
      type: "CREATED",
      content: "Lead qo'lda yaratildi",
      leadId: lead.id,
      organizationId: orgId,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateLeadStatusAction(
  leadId: string,
  status: string
): Promise<void> {
  const { orgId } = await currentOrg();
  if (!LEAD_STATUSES.includes(status as LeadStatus)) return;
  // "Sotildi" faqat summa bilan (markSoldAction) orqali belgilanadi
  if (status === "CONVERTED") return;

  // updateMany + organizationId — begona kompaniya leadiga tegib bo'lmaydi
  const res = await prisma.lead.updateMany({
    where: { id: leadId, organizationId: orgId },
    data: { status: status as LeadStatus },
  });
  if (res.count === 0) return;

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      content: `Status o'zgartirildi: ${STATUS_LABEL[status as LeadStatus]}`,
      leadId,
      organizationId: orgId,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

/** Ro'yxatdan turib "Sotildi" belgilash — summa bilan */
export async function markLeadSoldAction(
  leadId: string,
  amount: number
): Promise<void> {
  const { orgId, session } = await currentOrg();
  if (!Number.isFinite(amount) || amount < 0) return;

  const res = await prisma.lead.updateMany({
    where: { id: leadId, organizationId: orgId },
    data: { status: "CONVERTED", saleAmount: amount },
  });
  if (res.count === 0) return;

  await prisma.activity.create({
    data: {
      type: "CONVERTED",
      content: `Sotildi: ${amount.toLocaleString("uz-UZ")} so'm`,
      leadId,
      userId: session.userId,
      organizationId: orgId,
    },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
}

/** Sotuvni bekor qilish */
export async function unmarkLeadSoldAction(leadId: string): Promise<void> {
  const { orgId } = await currentOrg();
  await prisma.lead.updateMany({
    where: { id: leadId, organizationId: orgId },
    data: { status: "CONTACTED", saleAmount: null },
  });
  revalidatePath("/leads");
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
}

export async function deleteLeadAction(leadId: string): Promise<void> {
  const { orgId } = await currentOrg();
  await prisma.lead.deleteMany({
    where: { id: leadId, organizationId: orgId },
  });
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}
