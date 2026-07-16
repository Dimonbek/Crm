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
  QUALIFIED: "Kvalifikatsiya",
  CONVERTED: "Konvertatsiya",
  LOST: "Yo'qotilgan",
};

// Tailwind class'lari (badge uchun)
export const STATUS_CLASS: Record<LeadStatus, string> = {
  NEW: "bg-primary/15 text-primary border-primary/30",
  CONTACTED: "bg-warning/15 text-warning border-warning/30",
  QUALIFIED: "bg-sky-500/15 text-sky-400 border-sky-500/30",
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
