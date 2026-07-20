"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, getSession } from "@/lib/session";

export type AccountState = { error?: string; ok?: string };

const profileSchema = z.object({
  name: z.string().trim().min(2, "Ismni kiriting"),
  email: z.string().email("Email noto'g'ri"),
  username: z.string().trim().optional(),
});

/** Ism va login (email) ni o'zgartirish */
export async function updateProfileAction(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  const session = await requireUser();

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    username: formData.get("username"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { name } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const username = parsed.data.username?.toLowerCase().trim() || null;

  if (username && !/^[a-z0-9_.-]{3,32}$/.test(username)) {
    return { error: "Login faqat harf, raqam va _ . - dan iborat bo'lsin" };
  }

  // Email yoki login band emasligini tekshiramiz (o'zinikidan boshqa)
  const taken = await prisma.user.findFirst({
    where: {
      id: { not: session.userId },
      OR: username ? [{ email }, { username }] : [{ email }],
    },
  });
  if (taken) {
    return { error: "Bu email yoki login allaqachon band" };
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name, email, username },
    include: { organization: { select: { id: true, name: true } } },
  });

  // Sessiyani yangilaymiz — aks holda eski email/ism qoladi
  await createSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organization?.id ?? session.organizationId,
    organizationName: user.organization?.name ?? session.organizationName,
    impersonating: session.impersonating,
  });

  revalidatePath("/settings");
  return { ok: "Ma'lumotlar saqlandi" };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Joriy parolni kiriting"),
    next: z.string().min(6, "Yangi parol kamida 6 ta belgi"),
    confirm: z.string().min(1, "Parolni takrorlang"),
  })
  .refine((d) => d.next === d.confirm, {
    message: "Yangi parollar mos kelmadi",
    path: ["confirm"],
  });

/** Parolni o'zgartirish — joriy parol so'raladi */
export async function changePasswordAction(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  const session = await requireUser();

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "Foydalanuvchi topilmadi" };

  const valid = await verifyPassword(parsed.data.current, user.password);
  if (!valid) {
    return { error: "Joriy parol noto'g'ri" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(parsed.data.next) },
  });

  return { ok: "Parol o'zgartirildi" };
}

/** Impersonatsiya paytida hisobni o'zgartirmaslik uchun tekshiruv */
export async function isImpersonating(): Promise<boolean> {
  const s = await getSession();
  return !!s?.impersonating;
}
