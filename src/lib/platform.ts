import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session";

/**
 * Platforma egasi (DimoCRM administratori) — barcha kompaniyalarni boshqaradi.
 * Oddiy kompaniya ADMIN'idan farq qiladi: u faqat o'z kompaniyasini ko'radi.
 */
export function isPlatformAdmin(email: string): boolean {
  const owner = (
    process.env.PLATFORM_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    ""
  ).toLowerCase();
  return !!owner && email.toLowerCase() === owner;
}

export async function requirePlatformAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (!isPlatformAdmin(session.email)) {
    redirect("/dashboard");
  }
  return session;
}

/** Mijoz yordam so'rashi uchun Telegram manzili */
export function supportContact(): string {
  return process.env.SUPPORT_TELEGRAM || "dimonbek";
}
