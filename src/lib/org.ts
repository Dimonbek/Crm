import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

/** Kompaniya nomidan manzilga yaroqli slug yasaydi: "Riva Tour" → "riva-tour" */
export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/['`’]/g, "")
    .replace(/[^a-z0-9а-яўғҳқё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "kompaniya";
}

/** Band bo'lmagan slug topadi: riva-tour, riva-tour-2, ... */
export async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; i < 100; i++) {
    const exists = await prisma.organization.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${base}-${i}`;
  }
  return `${base}-${randomBytes(3).toString("hex")}`;
}

/** Bot shu token bilan o'z kompaniyasiga lead yuboradi */
export function newWebhookToken(): string {
  return randomBytes(24).toString("hex");
}
