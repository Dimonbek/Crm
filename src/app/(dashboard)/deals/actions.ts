"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
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
  const { orgId, session } = await currentOrg();

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

  // Kontakt va xodim shu kompaniyaniki ekanini tekshiramiz
  const contact = contactId
    ? await prisma.contact.findFirst({
        where: { id: contactId, organizationId: orgId },
      })
    : null;
  const assignee = assignedToId
    ? await prisma.user.findFirst({
        where: { id: assignedToId, organizationId: orgId },
      })
    : null;

  const deal = await prisma.deal.create({
    data: {
      title,
      amount: amount ?? null,
      stage,
      contactId: contact?.id ?? null,
      assignedToId: assignee?.id ?? null,
      organizationId: orgId,
    },
  });

  await prisma.activity.create({
    data: {
      type: "CREATED",
      content: "Bitim yaratildi",
      dealId: deal.id,
      userId: session.userId,
      organizationId: orgId,
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
  const { orgId, session } = await currentOrg();
  if (!DEAL_STAGES.includes(stage as DealStage)) return;

  const deal = await prisma.deal.findFirst({
    where: { id: dealId, organizationId: orgId },
  });
  if (!deal || deal.stage === stage) return;

  await prisma.deal.updateMany({
    where: { id: dealId, organizationId: orgId },
    data: { stage: stage as DealStage },
  });
  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      content: `Bosqich o'zgardi: ${STAGE_LABEL[stage as DealStage]}`,
      dealId,
      userId: session.userId,
      organizationId: orgId,
    },
  });

  revalidatePath("/deals");
  revalidatePath("/");
}

export async function deleteDealAction(dealId: string): Promise<void> {
  const { orgId } = await currentOrg();
  await prisma.deal.deleteMany({
    where: { id: dealId, organizationId: orgId },
  });
  revalidatePath("/deals");
  revalidatePath("/");
}
