import type { DealStage } from "@/generated/prisma/enums";

export const DEAL_STAGES: DealStage[] = [
  "QUALIFICATION",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
];

export const STAGE_LABEL: Record<DealStage, string> = {
  QUALIFICATION: "Kvalifikatsiya",
  PROPOSAL: "Taklif",
  NEGOTIATION: "Muzokara",
  CLOSED_WON: "Yutildi",
  CLOSED_LOST: "Yo'qotildi",
};

export const STAGE_ACCENT: Record<DealStage, string> = {
  QUALIFICATION: "border-t-primary",
  PROPOSAL: "border-t-sky-400",
  NEGOTIATION: "border-t-warning",
  CLOSED_WON: "border-t-success",
  CLOSED_LOST: "border-t-danger",
};
