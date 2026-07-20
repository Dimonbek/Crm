import type { LeadStatus } from "@/generated/prisma/enums";

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Yangi",
  CONTACTED: "Aloqada",
  QUALIFIED: "Qiziqyapti",
  CONVERTED: "Sotildi",
  LOST: "Yo'qotilgan",
};

/** Qo'lda tanlanadigan statuslar — "Sotildi" bundan mustasno,
 *  chunki u summa bilan alohida tugma orqali belgilanadi. */
export const SELECTABLE_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "LOST",
];

// Tailwind class'lari (badge uchun)
export const STATUS_CLASS: Record<LeadStatus, string> = {
  NEW: "bg-primary/15 text-primary border-primary/30",
  CONTACTED: "bg-warning/15 text-warning border-warning/30",
  QUALIFIED: "bg-warning/15 text-warning border-warning/30",
  CONVERTED: "bg-success/15 text-success border-success/30",
  LOST: "bg-danger/15 text-danger border-danger/30",
};

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
