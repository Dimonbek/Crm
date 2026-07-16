"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
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
  await requireUser();

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

  const lead = await prisma.lead.create({
    data: {
      phone,
      destination,
      travelDate: travelDate ? new Date(travelDate) : null,
      travelers,
      contactTime: contactTime || null,
      source: "manual",
    },
  });

  await prisma.activity.create({
    data: {
      type: "CREATED",
      content: "Lead qo'lda yaratildi",
      leadId: lead.id,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true };
}

export async function updateLeadStatusAction(
  leadId: string,
  status: string
): Promise<void> {
  await requireUser();
  if (!LEAD_STATUSES.includes(status as LeadStatus)) return;

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: status as LeadStatus },
  });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      content: `Status o'zgartirildi: ${STATUS_LABEL[status as LeadStatus]}`,
      leadId,
    },
  });

  revalidatePath("/leads");
  revalidatePath("/");
}

export async function deleteLeadAction(leadId: string): Promise<void> {
  await requireUser();
  await prisma.lead.delete({ where: { id: leadId } });
  revalidatePath("/leads");
  revalidatePath("/");
}
