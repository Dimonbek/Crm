import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActivityType } from "@/generated/prisma/enums";

/** Hodisa turi — rang va belgi */
const TYPE_META: Record<ActivityType, { icon: string; cls: string }> = {
  CREATED: { icon: "+", cls: "text-primary" },
  STATUS_CHANGE: { icon: "→", cls: "text-muted-foreground" },
  NOTE: { icon: "✎", cls: "text-muted-foreground" },
  CALL: { icon: "☎", cls: "text-muted-foreground" },
  EMAIL: { icon: "✉", cls: "text-muted-foreground" },
  MEETING: { icon: "◷", cls: "text-muted-foreground" },
  ASSIGNED: { icon: "◆", cls: "text-primary" },
  CONVERTED: { icon: "₩", cls: "text-success" },
};

/**
 * Platformadagi jonli faollik — kim, qaysi kompaniyada, nima qildi.
 *
 * Yangi maydon kerak emas: Activity jadvali har bir harakatni
 * (lead yaratish, status o'zgarishi, izoh, sotuv) allaqachon yozib boradi.
 */
export async function ActivityFeed({ limit = 40 }: { limit?: number }) {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      content: true,
      createdAt: true,
      leadId: true,
      user: { select: { name: true } },
      organization: { select: { name: true } },
    },
  });

  // Kun bo'yicha ajratib ko'rsatamiz
  const today = new Date().toDateString();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jonli faollik</CardTitle>
        <p className="text-sm text-muted-foreground">
          Kompaniyalar tizimda nima qilayotgani — eng yangisi yuqorida
        </p>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Hozircha harakat yo&apos;q
          </p>
        ) : (
          <div className="max-h-[32rem] divide-y divide-border overflow-y-auto">
            {activities.map((a) => {
              const meta = TYPE_META[a.type];
              const isToday = a.createdAt.toDateString() === today;
              return (
                <div key={a.id} className="flex items-start gap-3 py-2.5">
                  <span
                    className={`mt-0.5 w-4 shrink-0 text-center text-sm ${meta.cls}`}
                  >
                    {meta.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {a.organization?.name ?? "—"}
                      </Badge>
                      <span className="text-sm">{a.content}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {a.user?.name ?? "Tizim"} · {timeAgo(a.createdAt)}
                      {isToday && (
                        <span className="ml-1.5 text-success">bugun</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Har bir kompaniya bo'yicha 7 kunlik faollik —
 * jadvalda "tirikmi yoki tashlab qo'yilganmi" degan savolga javob.
 */
export async function weeklyActivity(): Promise<
  Map<string, { actions: number; lastAt: Date | null }>
> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [grouped, latest] = await Promise.all([
    prisma.activity.groupBy({
      by: ["organizationId"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.activity.groupBy({
      by: ["organizationId"],
      _max: { createdAt: true },
    }),
  ]);

  const map = new Map<string, { actions: number; lastAt: Date | null }>();
  for (const row of latest) {
    if (!row.organizationId) continue;
    map.set(row.organizationId, {
      actions: 0,
      lastAt: row._max.createdAt ?? null,
    });
  }
  for (const row of grouped) {
    if (!row.organizationId) continue;
    const cur = map.get(row.organizationId) ?? { actions: 0, lastAt: null };
    cur.actions = row._count._all;
    map.set(row.organizationId, cur);
  }
  return map;
}
