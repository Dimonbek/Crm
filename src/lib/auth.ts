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

/** Faqat ADMIN uchun. Aks holda bosh sahifaga yo'naltiradi. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}
