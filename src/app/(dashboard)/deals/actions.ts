"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { DEAL_STAGES, STAGE_LABEL } from "@/lib/deals";
import type { DealStage } from "@/generated/prisma/enums";

const createSchema = z.object({
  title: z.string().trim().min(1, "Sarlavha kiriting"),
  amount: z.coerce.number().min(0).optional(),
  stage: z.enum([
    "QUALIFICATION",
    "PROPOSAL",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
  ]),
  contactId: z.string().trim().optional(),
  assignedToId: z.string().trim().optional(),
});

export type CreateDealState = { error?: string; ok?: boolean };

export async function createDealAction(
  _prev: CreateDealState,
  formData: FormData
): Promise<CreateDealState> {
  const me = await requireUser();

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount") || undefined,
    stage: formData.get("stage"),
    contactId: formData.get("contactId"),
    assignedToId: formData.get("assignedToId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { title, amount, stage, contactId, assignedToId } = parsed.data;

  const deal = await prisma.deal.create({
    data: {
      title,
      amount: amount ?? null,
      stage,
      contactId: contactId || null,
      assignedToId: assignedToId || null,
    },
  });

  await prisma.activity.create({
    data: {
      type: "CREATED",
      content: "Bitim yaratildi",
      dealId: deal.id,
      userId: me.userId,
    },
  });

  revalidatePath("/deals");
  revalidatePath("/");
  return { ok: true };
}

export async function moveDealStageAction(
  dealId: string,
  stage: string
): Promise<void> {
  const me = await requireUser();
  if (!DEAL_STAGES.includes(stage as DealStage)) return;

  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal || deal.stage === stage) return;

  await prisma.deal.update({
    where: { id: dealId },
    data: { stage: stage as DealStage },
  });
  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      content: `Bosqich o'zgardi: ${STAGE_LABEL[stage as DealStage]}`,
      dealId,
      userId: me.userId,
    },
  });

  revalidatePath("/deals");
  revalidatePath("/");
}

export async function deleteDealAction(dealId: string): Promise<void> {
  await requireUser();
  await prisma.deal.delete({ where: { id: dealId } });
  revalidatePath("/deals");
  revalidatePath("/");
}
