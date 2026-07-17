import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/session";

/** Sessiyani qaytaradi, bo'lmasa login sahifasiga yo'naltiradi. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** Faqat kompaniya administratori uchun. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}

/**
 * Joriy kompaniya konteksti (multi-tenant izolyatsiya).
 *
 * MUHIM: barcha ma'lumot so'rovlari `where: { organizationId: orgId }` bilan
 * cheklanishi SHART — aks holda bir kompaniya boshqasining mijozlarini ko'radi.
 */
export async function currentOrg(): Promise<{
  orgId: string;
  session: SessionPayload;
}> {
  const session = await requireUser();
  if (!session.organizationId) {
    redirect("/login");
  }
  return { orgId: session.organizationId, session };
}
