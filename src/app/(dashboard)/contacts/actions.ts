"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";

// MUHIM: kontaktlar o'chirilmaydi — mijoz tarixi doimiy saqlanadi.

const createSchema = z.object({
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
  const { orgId } = await currentOrg();

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { name, phone, email, notes } = parsed.data;

  const existing = await prisma.contact.findFirst({
    where: { phone, organizationId: orgId },
  });
  if (existing) {
    return { error: "Bu telefon raqamli mijoz allaqachon mavjud" };
  }

  await prisma.contact.create({
    data: {
      name: name || null,
      phone,
      email: email || null,
      notes: notes || null,
      organizationId: orgId,
    },
  });

  revalidatePath("/contacts");
  return { ok: true };
}

const updateSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

/** Mijoz ma'lumotini tahrirlash (ism, email, eslatma) */
export async function updateContactAction(
  contactId: string,
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const { orgId } = await currentOrg();

  const parsed = updateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { name, email, notes } = parsed.data;

  await prisma.contact.updateMany({
    where: { id: contactId, organizationId: orgId },
    data: {
      name: name || null,
      email: email || null,
      notes: notes || null,
    },
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
  return { ok: true };
}
