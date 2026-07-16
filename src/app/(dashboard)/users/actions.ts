"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { ROLES } from "@/lib/roles";
import type { Role } from "@/generated/prisma/enums";

const createSchema = z.object({
  name: z.string().trim().min(1, "Ism kiriting"),
  email: z.string().email("Email noto'g'ri"),
  password: z.string().min(6, "Parol kamida 6 ta belgi"),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]),
});

export type CreateUserState = { error?: string; ok?: boolean };

export async function createUserAction(
  _prev: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  await requireAdmin();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { name, email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Bu email allaqachon ro'yxatdan o'tgan" };
  }

  await prisma.user.create({
    data: { name, email, password: await hashPassword(password), role },
  });

  revalidatePath("/users");
  return { ok: true };
}

export async function toggleUserActiveAction(userId: string): Promise<void> {
  const admin = await requireAdmin();
  if (admin.userId === userId) return; // o'zini bloklamaslik

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  await prisma.user.update({
    where: { id: userId },
    data: { active: !user.active },
  });
  revalidatePath("/users");
}

export async function changeUserRoleAction(
  userId: string,
  role: string
): Promise<void> {
  await requireAdmin();
  if (!ROLES.includes(role as Role)) return;

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as Role },
  });
  revalidatePath("/users");
}
