"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email("Email noto'g'ri"),
  password: z.string().min(1, "Parol kiriting"),
});

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    return { error: "Email yoki parol noto'g'ri" };
  }

  await createSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  redirect("/");
}
