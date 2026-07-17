"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { uniqueSlug, newWebhookToken } from "@/lib/org";

const schema = z.object({
  company: z.string().trim().min(2, "Kompaniya nomini kiriting"),
  name: z.string().trim().min(2, "Ismingizni kiriting"),
  email: z.string().email("Email noto'g'ri"),
  password: z.string().min(6, "Parol kamida 6 ta belgi"),
});

export type RegisterState = { error?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = schema.safeParse({
    company: formData.get("company"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { company, name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Bu email allaqachon ro'yxatdan o'tgan" };
  }

  // Kompaniya + uning birinchi admini birga yaratiladi
  const org = await prisma.organization.create({
    data: {
      name: company,
      slug: await uniqueSlug(company),
      webhookToken: newWebhookToken(),
      users: {
        create: {
          name,
          email,
          password: await hashPassword(password),
          role: "ADMIN",
        },
      },
    },
    include: { users: true },
  });

  const owner = org.users[0];

  await createSession({
    userId: owner.id,
    name: owner.name,
    email: owner.email,
    role: owner.role,
    organizationId: org.id,
    organizationName: org.name,
  });

  redirect("/");
}
