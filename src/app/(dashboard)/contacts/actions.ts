"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().optional(),
  phone: z.string().trim().min(3, "Telefon raqamini kiriting"),
  email: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ContactState = { error?: string; ok?: boolean };

export async function createContactAction(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  await requireUser();

  const parsed = schema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { name, phone, email, notes } = parsed.data;

  const existing = await prisma.contact.findUnique({ where: { phone } });
  if (existing) {
    return { error: "Bu telefon raqamli kontakt allaqachon mavjud" };
  }

  await prisma.contact.create({
    data: {
      name: name || null,
      phone,
      email: email || null,
      notes: notes || null,
    },
  });

  revalidatePath("/contacts");
  return { ok: true };
}

export async function deleteContactAction(contactId: string): Promise<void> {
  await requireUser();
  await prisma.contact.delete({ where: { id: contactId } });
  revalidatePath("/contacts");
}
