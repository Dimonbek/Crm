import Link from "next/link";
import { currentOrg } from "@/lib/auth";
import { timeAgo, formatDateTime } from "@/lib/format";
import {
  getNotifications,
  sweepTimeBasedNotifications,
} from "@/lib/notifications";
import { NOTIF_LABEL, NOTIF_ICON } from "@/lib/notifications-meta";
import { PageHeader } from "@/components/page";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkAllReadButton } from "./mark-all-read";

/** Bildirishnomalar tarixi — qo'ng'iroqchadagi "Barchasini ko'rish". */
export default async function NotificationsPage() {
  const { orgId, session } = await currentOrg();

  // Sahifa ochilganda ham vaqtga bog'liq eslatmalar hisoblanadi
  await sweepTimeBasedNotifications(orgId);
  const { items, unread } = await getNotifications(session.userId, 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bildirishnomalar"
        description={
          unread > 0
            ? `${unread} ta o'qilmagan bildirishnoma`
            : "Barchasi o'qilgan"
        }
        action={unread > 0 ? <MarkAllReadButton /> : undefined}
      />

      {items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Hozircha bildirishnoma yo&apos;q. Yangi lead kelganda, vazifa muddati
          yetganda yoki lead sovib qolganda shu yerda paydo bo&apos;ladi.
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden py-0">
          {items.map((item) => {
            const inner = (
              <div
                className={`flex items-start gap-3 px-4 py-3.5 transition ${
                  item.link ? "hover:bg-muted/60" : ""
                } ${item.read ? "" : "bg-primary/5"}`}
              >
                <span
                  className={`mt-0.5 w-5 shrink-0 text-center text-base ${
                    item.type === "STALE" || item.type === "TASK_DUE"
                      ? "text-destructive"
                      : "text-primary"
                  }`}
                >
                  {NOTIF_ICON[item.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm ${
                        item.read ? "text-muted-foreground" : "font-medium"
                      }`}
                    >
                      {item.title}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {NOTIF_LABEL[item.type]}
                    </Badge>
                  </div>
                  {item.body && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.body}
                    </p>
                  )}
                  <p
                    className="mt-1 text-[11px] text-muted-foreground/80"
                    title={formatDateTime(item.createdAt)}
                  >
                    {timeAgo(item.createdAt)}
                  </p>
                </div>
                {!item.read && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
            );

            return item.link ? (
              <Link key={item.id} href={item.link} className="block">
                {inner}
              </Link>
            ) : (
              <div key={item.id}>{inner}</div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
