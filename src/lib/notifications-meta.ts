import type { NotificationType } from "@/generated/prisma/enums";

/**
 * Bildirishnoma turlarining yorliqlari — mijoz (client) komponentlari ham
 * ishlatadi, shuning uchun bu fayl prisma'ga bog'lanmaydi.
 */

export const NOTIF_LABEL: Record<NotificationType, string> = {
  NEW_LEAD: "Yangi lead",
  ASSIGNED: "Biriktirildi",
  TASK_DUE: "Vazifa muddati",
  STALE: "Sovib qolgan",
};

export const NOTIF_ICON: Record<NotificationType, string> = {
  NEW_LEAD: "◎",
  ASSIGNED: "◆",
  TASK_DUE: "✓",
  STALE: "!",
};
