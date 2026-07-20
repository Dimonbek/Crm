"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

const schema = z.object({
  login: z.string().trim().min(1, "Login yoki emailni kiriting"),
  password: z.string().min(1, "Parol kiriting"),
});

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = schema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const login = parsed.data.login.toLowerCase();
  const { password } = parsed.data;

  // Email yoki qisqa login bilan kirish mumkin
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: login }, { username: login }] },
    include: { organization: true },
  });

  if (!user || !(await verifyPassword(password, user.password))) {
    return { error: "Login yoki parol noto'g'ri" };
  }
  if (!user.active) {
    return { error: "Hisobingiz bloklangan. Administratorga murojaat qiling." };
  }
  if (!user.organization) {
    return { error: "Hisobingiz kompaniyaga biriktirilmagan." };
  }

  await createSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organization.id,
    organizationName: user.organization.name,
  });

  redirect("/dashboard");
}
