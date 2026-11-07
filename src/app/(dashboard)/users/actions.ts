"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, currentOrg } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { ROLES } from "@/lib/roles";
import type { Role } from "@/generated/prisma/enums";

/** Login uchun xavfsiz ko'rinish: faqat kichik harf, raqam va pastki chiziq */
function normalizeUsername(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['`’]/g, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

/** Oson aytiladigan, lekin taxmin qilib bo'lmaydigan parol */
function generatePassword(): string {
  const words = ["olma", "anor", "nilufar", "shamol", "quyosh", "daryo", "chinor", "bahor"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}${n}`;
}

const createSchema = z.object({
  name: z.string().trim().min(1, "Ism kiriting"),
  username: z.string().trim().optional(),
  email: z.string().trim().optional(),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]),
});

export type CreateUserState = {
  error?: string;
  ok?: boolean;
  /** Yaratilgandan keyin adminga ko'rsatiladigan kirish ma'lumotlari */
  created?: { name: string; login: string; password: string };
};

/**
 * Yangi xodim qo'shish.
 *
 * Yengilliklar:
 *  - Email shart emas — xodim qisqa login bilan kiradi (masalan "aziza").
 *    Email bo'lmasa, tizim ichki manzil o'ylab topadi.
 *  - Parol shart emas — bo'sh qoldirilsa tizim o'zi yasaydi va
 *    adminga bir marta ko'rsatadi.
 */
export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await requireAdmin();
  const { orgId } = await currentOrg();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { name, role } = parsed.data;

  // Login: kiritilgani, bo'lmasa ismdan yasaladi
  const username = normalizeUsername(parsed.data.username || name);
  if (username.length < 3) {
    return { error: "Login kamida 3 ta harf bo'lsin (masalan: aziza)" };
  }

  const emailInput = (parsed.data.email || "").trim().toLowerCase();
  if (emailInput && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailInput)) {
    return { error: "Email noto'g'ri yozilgan" };
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { slug: true },
  });
  // Email bo'lmasa — ichki manzil. Xodim baribir login bilan kiradi.
  const email = emailInput || `${username}@${org?.slug ?? "crm"}.local`;

  const clash = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (clash) {
    return {
      error:
        clash.username === username
          ? `"${username}" logini band — boshqasini tanlang`
          : "Bu email allaqachon ro'yxatdan o'tgan",
    };
  }

  const rawPassword = (parsed.data.password || "").trim();
  if (rawPassword && rawPassword.length < 6) {
    return { error: "Parol kamida 6 ta belgi bo'lsin" };
  }
  const password = rawPassword || generatePassword();

  await prisma.user.create({
    data: {
      name,
      email,
      username,
      password: await hashPassword(password),
      role,
      organizationId: orgId,
    },
  });

  revalidatePath("/users");
  return { ok: true, created: { name, login: username, password } };
}

export async function toggleUserActiveAction(userId: string): Promise<void> {
  const admin = await requireAdmin();
  const { orgId } = await currentOrg();
  if (admin.userId === userId) return; // o'zini bloklamaslik

  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId: orgId },
  });
  if (!user) return;

  await prisma.user.updateMany({
    where: { id: userId, organizationId: orgId },
    data: { active: !user.active },
  });
  revalidatePath("/users");
}

export async function changeUserRoleAction(
  userId: string,
  role: string
): Promise<void> {
  const admin = await requireAdmin();
  const { orgId } = await currentOrg();
  if (admin.userId === userId) return; // o'z rolini o'zgartirmaslik
  if (!ROLES.includes(role as Role)) return;

  await prisma.user.updateMany({
    where: { id: userId, organizationId: orgId },
    data: { role: role as Role },
  });
  revalidatePath("/users");
}

export type DeleteUserState = { error?: string; ok?: boolean };

/**
 * Xodimni butunlay o'chirish.
 *
 * Lead, bitim va vazifalar o'chmaydi — ular shunchaki "tayinlanmagan"
 * holatiga o'tadi, tarix esa egasiz yozuv sifatida saqlanadi.
 * Himoya: o'zini o'chira olmaydi, oxirgi administrator o'chmaydi.
 */
export async function deleteUserAction(userId: string): Promise<DeleteUserState> {
  const admin = await requireAdmin();
  const { orgId } = await currentOrg();

  if (admin.userId === userId) {
    return { error: "O'zingizni o'chira olmaysiz" };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId: orgId },
    select: { id: true, role: true },
  });
  if (!user) return { error: "Xodim topilmadi" };

  if (user.role === "ADMIN") {
    const admins = await prisma.user.count({
      where: { organizationId: orgId, role: "ADMIN" },
    });
    if (admins <= 1) {
      return { error: "Oxirgi administratorni o'chirib bo'lmaydi" };
    }
  }

  // Bog'liq yozuvlarni bo'shatamiz — ma'lumot yo'qolmaydi
  await prisma.$transaction([
    prisma.lead.updateMany({
      where: { assignedToId: userId, organizationId: orgId },
      data: { assignedToId: null },
    }),
    prisma.deal.updateMany({
      where: { assignedToId: userId, organizationId: orgId },
      data: { assignedToId: null },
    }),
    prisma.task.updateMany({
      where: { assignedToId: userId, organizationId: orgId },
      data: { assignedToId: null },
    }),
    prisma.activity.updateMany({
      where: { userId, organizationId: orgId },
      data: { userId: null },
    }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  revalidatePath("/users");
  revalidatePath("/leads");
  revalidatePath("/tasks");
  return { ok: true };
}
