import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/enums";

/**
 * CRM ichidagi bildirishnomalar.
 *
 * Asosiy qoidalar:
 *  - Har bir yozuv bitta foydalanuvchiga tegishli (o'qilganlik shaxsiy).
 *  - `dedupeKey` bir xil hodisa ikki marta yozilishini to'sadi.
 *  - Bildirishnoma yozish hech qachon asosiy amalni buzmasligi kerak —
 *    shuning uchun barcha yozishlar try/catch ichida (xato faqat logga tushadi).
 */

export { NOTIF_LABEL, NOTIF_ICON } from "@/lib/notifications-meta";

/** Sovib qolgan hisoblanish chegaralari */
const STALE_LEAD_HOURS = 48;
const STALE_DEAL_DAYS = 7;

/** Sovib qolgan haqida eslatma har 7 kunda bir marta takrorlanadi */
function weekBucket(): string {
  return String(Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)));
}

export type NotifyInput = {
  orgId: string;
  /** Kimga — bo'sh ro'yxat bo'lsa hech narsa yozilmaydi */
  userIds: string[];
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  /** Takrorlanmaslik kaliti (foydalanuvchi bo'yicha unikal) */
  dedupeKey?: string | null;
};

/** Bir nechta xodimga bitta bildirishnoma yozadi. */
export async function notify(input: NotifyInput): Promise<void> {
  const userIds = [...new Set(input.userIds.filter(Boolean))];
  if (userIds.length === 0) return;

  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        organizationId: input.orgId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        dedupeKey: input.dedupeKey ?? null,
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.warn("Bildirishnoma yozilmadi:", err);
  }
}

/**
 * Kompaniyadagi xabardor qilinadigan xodimlar.
 * Lead egasi yo'q bo'lsa — ADMIN va MANAGER larga ketadi (operatorlarga emas).
 */
export async function orgWatcherIds(orgId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      organizationId: orgId,
      active: true,
      role: { in: ["ADMIN", "MANAGER"] },
    },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/** Kompaniyadagi adminlar — egasiz yozuvlar bo'yicha eslatmalar uchun. */
async function orgAdminIds(orgId: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { organizationId: orgId, active: true, role: "ADMIN" },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/* ─────────────── Hodisalar ─────────────── */

/** Yangi lead keldi. Egasi bo'lsa — unga, bo'lmasa — admin/menejerlarga. */
export async function notifyNewLead(opts: {
  orgId: string;
  leadId: string;
  phone: string;
  destination: string;
  source: string;
  assignedToId?: string | null;
}): Promise<void> {
  const userIds = opts.assignedToId
    ? [opts.assignedToId]
    : await orgWatcherIds(opts.orgId);

  await notify({
    orgId: opts.orgId,
    userIds,
    type: "NEW_LEAD",
    title:
      opts.source === "telegram"
        ? "Botdan yangi lead keldi"
        : "Yangi lead qo'shildi",
    body: `${opts.phone} — ${opts.destination}`,
    link: `/leads/${opts.leadId}`,
    dedupeKey: `new_lead:${opts.leadId}`,
  });
}

/** Lead yoki bitim xodimga biriktirildi. */
export async function notifyAssigned(opts: {
  orgId: string;
  userId: string;
  /** Biriktirgan odam — o'ziga o'zi biriktirsa bildirishnoma kerak emas */
  actorId?: string | null;
  kind: "lead" | "deal";
  entityId: string;
  label: string;
}): Promise<void> {
  if (!opts.userId || opts.userId === opts.actorId) return;

  await notify({
    orgId: opts.orgId,
    userIds: [opts.userId],
    type: "ASSIGNED",
    title:
      opts.kind === "lead"
        ? "Sizga yangi lead biriktirildi"
        : "Sizga bitim biriktirildi",
    body: opts.label,
    link: opts.kind === "lead" ? `/leads/${opts.entityId}` : "/deals",
    // Biriktirish qayta-qayta o'zgarishi mumkin — har safar xabar bersin
    dedupeKey: null,
  });
}

/* ─────────────── Vaqtga bog'liq eslatmalar (sweep) ─────────────── */

/**
 * Cron yo'q — shuning uchun muddati kelgan vazifalar va sovib qolgan
 * lead/bitimlar qo'ng'iroqcha ochilganda hisoblanadi.
 * `dedupeKey` tufayli bir hodisa uchun faqat bitta yozuv paydo bo'ladi.
 */
export async function sweepTimeBasedNotifications(orgId: string): Promise<void> {
  const now = new Date();

  try {
    await Promise.all([
      sweepDueTasks(orgId, now),
      sweepStaleLeads(orgId, now),
      sweepStaleDeals(orgId, now),
    ]);
  } catch (err) {
    console.warn("Bildirishnoma sweep xatosi:", err);
  }
}

async function sweepDueTasks(orgId: string, now: Date): Promise<void> {
  const tasks = await prisma.task.findMany({
    where: {
      organizationId: orgId,
      status: { not: "DONE" },
      dueDate: { not: null, lte: now },
      assignedToId: { not: null },
    },
    select: { id: true, title: true, dueDate: true, assignedToId: true },
    take: 100,
  });

  for (const task of tasks) {
    const overdue = task.dueDate ? task.dueDate.getTime() < now.getTime() - 60_000 : false;
    await notify({
      orgId,
      userIds: [task.assignedToId!],
      type: "TASK_DUE",
      title: overdue ? "Vazifa muddati o'tdi" : "Vazifa muddati keldi",
      body: task.title,
      link: "/tasks",
      dedupeKey: `task_due:${task.id}`,
    });
  }
}

async function sweepStaleLeads(orgId: string, now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - STALE_LEAD_HOURS * 60 * 60 * 1000);
  const leads = await prisma.lead.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["NEW", "CONTACTED", "QUALIFIED"] },
      updatedAt: { lt: cutoff },
    },
    select: {
      id: true,
      phone: true,
      destination: true,
      assignedToId: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "asc" },
    take: 50,
  });
  if (leads.length === 0) return;

  const admins = await orgAdminIds(orgId);
  const bucket = weekBucket();

  for (const lead of leads) {
    const days = Math.floor(
      (now.getTime() - lead.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    await notify({
      orgId,
      userIds: lead.assignedToId ? [lead.assignedToId] : admins,
      type: "STALE",
      title: `Lead ${days >= 1 ? `${days} kundan` : `${STALE_LEAD_HOURS} soatdan`} beri tegilmagan`,
      body: `${lead.phone} — ${lead.destination}`,
      link: `/leads/${lead.id}`,
      dedupeKey: `stale_lead:${lead.id}:${bucket}`,
    });
  }
}

async function sweepStaleDeals(orgId: string, now: Date): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { dealsEnabled: true },
  });
  if (!org?.dealsEnabled) return;

  const cutoff = new Date(now.getTime() - STALE_DEAL_DAYS * 24 * 60 * 60 * 1000);
  const deals = await prisma.deal.findMany({
    where: {
      organizationId: orgId,
      stage: { notIn: ["CLOSED_WON", "CLOSED_LOST"] },
      updatedAt: { lt: cutoff },
    },
    select: { id: true, title: true, assignedToId: true, updatedAt: true },
    orderBy: { updatedAt: "asc" },
    take: 50,
  });
  if (deals.length === 0) return;

  const admins = await orgAdminIds(orgId);
  const bucket = weekBucket();

  for (const deal of deals) {
    const days = Math.floor(
      (now.getTime() - deal.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
    );
    await notify({
      orgId,
      userIds: deal.assignedToId ? [deal.assignedToId] : admins,
      type: "STALE",
      title: `Bitim ${days} kundan beri bir bosqichda`,
      body: deal.title,
      link: "/deals",
      dedupeKey: `stale_deal:${deal.id}:${bucket}`,
    });
  }
}

/* ─────────────── O'qish ─────────────── */

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

/** Qo'ng'iroqcha uchun ro'yxat + o'qilmaganlar soni. */
export async function getNotifications(
  userId: string,
  limit = 20
): Promise<{ items: NotificationItem[]; unread: number }> {
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return {
    items: rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      link: r.link,
      read: r.readAt !== null,
      createdAt: r.createdAt,
    })),
    unread,
  };
}

/** Eski bildirishnomalarni tozalash — 60 kundan oshgan o'qilganlar. */
export async function pruneOldNotifications(userId: string): Promise<void> {
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  try {
    await prisma.notification.deleteMany({
      where: { userId, readAt: { not: null }, createdAt: { lt: cutoff } },
    });
  } catch {
    // tozalash muhim emas — xatoni e'tiborsiz qoldiramiz
  }
}
