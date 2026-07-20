"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/platform";
import { hashPassword } from "@/lib/password";
import { uniqueSlug, newWebhookToken } from "@/lib/org";

const createSchema = z.object({
  company: z.string().trim().min(2, "Kompaniya nomini kiriting"),
  adminName: z.string().trim().min(2, "Mas'ul shaxs ismini kiriting"),
  email: z.string().email("Email noto'g'ri"),
  password: z.string().min(6, "Parol kamida 6 ta belgi"),
  botUsername: z.string().trim().optional(),
});

export type AdminState = { error?: string; ok?: boolean };

/** Mijoz uchun kompaniya + uning admin hisobini yaratish */
export async function createOrgAction(
  _prev: AdminState,
  formData: FormData
): Promise<AdminState> {
  await requirePlatformAdmin();

  const parsed = createSchema.safeParse({
    company: formData.get("company"),
    adminName: formData.get("adminName"),
    email: formData.get("email"),
    password: formData.get("password"),
    botUsername: formData.get("botUsername"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { company, adminName, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const botUsername =
    parsed.data.botUsername?.replace(/^@/, "").trim() || undefined;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Bu email allaqachon ro'yxatdan o'tgan" };
  }

  await prisma.organization.create({
    data: {
      name: company,
      slug: await uniqueSlug(company),
      webhookToken: newWebhookToken(),
      botUsername: botUsername || null,
      users: {
        create: {
          name: adminName,
          email,
          password: await hashPassword(password),
          role: "ADMIN",
        },
      },
    },
  });

  revalidatePath("/admin");
  return { ok: true };
}

/** Qaysi bot qaysi kompaniyaga tegishli — yozib qo'yish */
export async function setBotUsernameAction(
  orgId: string,
  raw: string
): Promise<void> {
  await requirePlatformAdmin();
  const username = raw
    .replace(/^@/, "")
    .replace(/^https?:\/\/t\.me\//, "")
    .trim();
  if (username && !/^[A-Za-z0-9_]{3,32}$/.test(username)) return;

  await prisma.organization.update({
    where: { id: orgId },
    data: { botUsername: username || null },
  });
  revalidatePath("/admin");
}

/** Bot kalitini yangilash (eski kalit ishlamay qoladi) */
export async function regenerateTokenAction(orgId: string): Promise<void> {
  await requirePlatformAdmin();
  await prisma.organization.update({
    where: { id: orgId },
    data: { webhookToken: newWebhookToken() },
  });
  revalidatePath("/admin");
}

/** Kompaniya adminiga yangi parol berish */
export async function resetPasswordAction(
  userId: string,
  password: string
): Promise<void> {
  await requirePlatformAdmin();
  if (!password || password.length < 6) return;
  await prisma.user.update({
    where: { id: userId },
    data: { password: await hashPassword(password) },
  });
  revalidatePath("/admin");
}
