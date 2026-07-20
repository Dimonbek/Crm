"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/lib/platform";
import { hashPassword } from "@/lib/password";
import { uniqueSlug, newWebhookToken } from "@/lib/org";
import { createSession, getSession } from "@/lib/session";

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

/**
 * Kompaniya ichiga kirish — platforma egasi uning CRM'ini xuddi o'zi kabi ko'radi.
 * Sessiyaga o'sha kompaniya yoziladi, "impersonating" belgisi qo'yiladi.
 */
export async function viewAsOrgAction(orgId: string): Promise<void> {
  const session = await requirePlatformAdmin();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true },
  });
  if (!org) return;

  await createSession({
    ...session,
    organizationId: org.id,
    organizationName: org.name,
    impersonating: true,
  });

  redirect("/dashboard");
}

/** Ko'rishni tugatib, o'z kompaniyangizga qaytish */
export async function stopViewingAction(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { organization: { select: { id: true, name: true } } },
  });
  if (!me?.organization) redirect("/login");

  await createSession({
    userId: me.id,
    name: me.name,
    email: me.email,
    role: me.role,
    organizationId: me.organization.id,
    organizationName: me.organization.name,
  });

  redirect("/admin");
}

/**
 * Kompaniyani o'chirish — barcha ma'lumoti bilan (leadlar, mijozlar, bitimlar).
 * Qaytarib bo'lmaydi, shuning uchun nom yozib tasdiqlanadi.
 */
export async function deleteOrgAction(
  orgId: string,
  confirmName: string
): Promise<{ error?: string } | void> {
  const session = await requirePlatformAdmin();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { users: { select: { id: true, email: true } } },
  });
  if (!org) return { error: "Kompaniya topilmadi" };

  // Nom mos kelmasa — o'chirmaymiz
  if (confirmName.trim() !== org.name.trim()) {
    return { error: "Nom mos kelmadi" };
  }

  // O'z kompaniyangizni o'chirib qo'ymaslik uchun himoya
  const isOwn = org.users.some(
    (u) => u.email.toLowerCase() === session.email.toLowerCase()
  );
  if (isOwn) {
    return { error: "O'zingiz tegishli kompaniyani o'chira olmaysiz" };
  }

  // Bog'liq yozuvlar (leadlar, mijozlar, bitimlar...) Cascade bilan o'chadi
  await prisma.organization.delete({ where: { id: orgId } });

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
