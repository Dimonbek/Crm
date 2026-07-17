"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentOrg, requireAdmin } from "@/lib/auth";
import { normalizeCode } from "@/lib/campaigns";

const createSchema = z.object({
  name: z.string().trim().min(1, "Kampaniya nomini kiriting"),
  code: z.string().trim().optional(),
  channel: z.string().trim().optional(),
  budget: z.coerce.number().min(0).default(0),
});

export type CampaignState = { error?: string; ok?: boolean };

export async function createCampaignAction(
  _prev: CampaignState,
  formData: FormData
): Promise<CampaignState> {
  const { orgId } = await currentOrg();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    code: formData.get("code"),
    channel: formData.get("channel"),
    budget: formData.get("budget") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { name, channel, budget } = parsed.data;
  // Kod berilmasa — nomdan yasaymiz
  const code = normalizeCode(parsed.data.code || name);
  if (!code) {
    return { error: "Kod noto'g'ri — lotin harflari yoki raqam ishlating" };
  }

  const existing = await prisma.campaign.findFirst({
    where: { organizationId: orgId, code },
  });
  if (existing) {
    return { error: `"${code}" kodi allaqachon ishlatilgan` };
  }

  await prisma.campaign.create({
    data: {
      name,
      code,
      channel: channel || null,
      budget,
      organizationId: orgId,
    },
  });

  revalidatePath("/campaigns");
  return { ok: true };
}

/** Byudjetni yangilash — reklama davom etgani sari pul qo'shiladi */
export async function updateBudgetAction(
  campaignId: string,
  budget: number
): Promise<void> {
  const { orgId } = await currentOrg();
  if (!Number.isFinite(budget) || budget < 0) return;

  await prisma.campaign.updateMany({
    where: { id: campaignId, organizationId: orgId },
    data: { budget },
  });
  revalidatePath("/campaigns");
}

export async function toggleCampaignAction(campaignId: string): Promise<void> {
  const { orgId } = await currentOrg();
  const c = await prisma.campaign.findFirst({
    where: { id: campaignId, organizationId: orgId },
  });
  if (!c) return;
  await prisma.campaign.updateMany({
    where: { id: campaignId, organizationId: orgId },
    data: { active: !c.active },
  });
  revalidatePath("/campaigns");
}

export async function deleteCampaignAction(campaignId: string): Promise<void> {
  const { orgId } = await currentOrg();
  // Leadlar o'chmaydi — ularning campaignId si null bo'ladi (SetNull)
  await prisma.campaign.deleteMany({
    where: { id: campaignId, organizationId: orgId },
  });
  revalidatePath("/campaigns");
}

/** Bot username — reklama havolalarini yasash uchun */
export async function saveBotUsernameAction(
  _prev: CampaignState,
  formData: FormData
): Promise<CampaignState> {
  await requireAdmin();
  const { orgId } = await currentOrg();

  const raw = String(formData.get("botUsername") ?? "").trim();
  const username = raw.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");

  if (username && !/^[A-Za-z0-9_]{3,32}$/.test(username)) {
    return { error: "Bot username noto'g'ri (masalan: RivaTourBot)" };
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: { botUsername: username || null },
  });

  revalidatePath("/campaigns");
  return { ok: true };
}
