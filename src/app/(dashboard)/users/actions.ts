"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, currentOrg } from "@/lib/auth";
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
  const { orgId } = await currentOrg();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { name, password, role } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Bu email allaqachon ro'yxatdan o'tgan" };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
      role,
      organizationId: orgId,
    },
  });

  revalidatePath("/users");
  return { ok: true };
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
