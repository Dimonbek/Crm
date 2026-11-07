"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import {
  getNotifications,
  pruneOldNotifications,
  sweepTimeBasedNotifications,
  type NotificationItem,
} from "@/lib/notifications";

export type NotificationFeed = {
  items: NotificationItem[];
  unread: number;
};

/**
 * Qo'ng'iroqcha ochilganda chaqiriladi.
 * Avval vaqtga bog'liq eslatmalar hisoblanadi (vazifa muddati, sovib qolganlar),
 * keyin ro'yxat qaytariladi.
 */
export async function fetchNotificationsAction(): Promise<NotificationFeed> {
  const { orgId, session } = await currentOrg();
  await sweepTimeBasedNotifications(orgId);
  return getNotifications(session.userId);
}

/** Yangilanishni tez tekshirish — faqat o'qilmaganlar soni (sweep'siz). */
export async function pollUnreadCountAction(): Promise<number> {
  const { session } = await currentOrg();
  return prisma.notification.count({
    where: { userId: session.userId, readAt: null },
  });
}

/** Bittasini o'qilgan deb belgilash. */
export async function markNotificationReadAction(id: string): Promise<void> {
  const { session } = await currentOrg();
  await prisma.notification.updateMany({
    where: { id, userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/notifications");
}

/** Hammasini o'qilgan deb belgilash. */
export async function markAllNotificationsReadAction(): Promise<void> {
  const { session } = await currentOrg();
  await prisma.notification.updateMany({
    where: { userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  });
  await pruneOldNotifications(session.userId);
  revalidatePath("/notifications");
}
