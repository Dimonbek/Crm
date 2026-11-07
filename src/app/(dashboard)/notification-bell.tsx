"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { NOTIF_ICON } from "@/lib/notifications-meta";
import {
  fetchNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  pollUnreadCountAction,
  type NotificationFeed,
} from "./notification-actions";

/** O'qilmaganlar sonini qancha vaqtda bir tekshirish */
const POLL_MS = 60_000;

/**
 * Header'dagi bildirishnoma qo'ng'iroqchasi.
 *
 * - Boshlang'ich holat serverdan keladi (layout), shuning uchun sahifa
 *   ochilishi bilan raqam ko'rinadi.
 * - Har daqiqada faqat o'qilmaganlar soni so'raladi (arzon so'rov).
 * - Ro'yxat qo'ng'iroqcha bosilganda yuklanadi — shu paytda server
 *   vazifa muddati va sovib qolganlarni ham hisoblaydi.
 */
export function NotificationBell({
  initialUnread,
}: {
  initialUnread: number;
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [feed, setFeed] = useState<NotificationFeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Tashqariga bosilganda yopilsin
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Fon rejimida o'qilmaganlar sonini kuzatish
  useEffect(() => {
    let alive = true;
    const timer = setInterval(() => {
      if (document.hidden) return;
      pollUnreadCountAction()
        .then((n) => {
          if (alive) setUnread(n);
        })
        .catch(() => {});
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotificationsAction();
      setFeed(data);
      setUnread(data.unread);
    } catch {
      setFeed({ items: [], unread: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) void load();
  }

  function markAll() {
    setUnread(0);
    setFeed((f) =>
      f ? { items: f.items.map((i) => ({ ...i, read: true })), unread: 0 } : f
    );
    startTransition(() => {
      void markAllNotificationsReadAction();
    });
  }

  function openItem(id: string, link: string | null, read: boolean) {
    setOpen(false);
    if (!read) {
      setUnread((n) => Math.max(0, n - 1));
      startTransition(() => {
        void markNotificationReadAction(id);
      });
    }
    if (link) router.push(link);
  }

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label="Bildirishnomalar"
        title="Bildirishnomalar"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold">Bildirishnomalar</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs text-primary transition hover:underline"
              >
                Hammasini o&apos;qildim
              </button>
            )}
          </div>

          <div className="max-h-[22rem] overflow-y-auto">
            {loading && !feed && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Yuklanmoqda…
              </div>
            )}

            {feed && feed.items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Hozircha bildirishnoma yo&apos;q
              </div>
            )}

            {feed?.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openItem(item.id, item.link, item.read)}
                className={`flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition last:border-b-0 hover:bg-muted/60 ${
                  item.read ? "" : "bg-primary/5"
                }`}
              >
                <span
                  className={`mt-0.5 w-4 shrink-0 text-center text-base ${
                    item.type === "STALE" || item.type === "TASK_DUE"
                      ? "text-destructive"
                      : "text-primary"
                  }`}
                >
                  {NOTIF_ICON[item.type]}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm ${
                      item.read ? "text-muted-foreground" : "font-medium"
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.body && (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {item.body}
                    </span>
                  )}
                  <span className="mt-1 block text-[11px] text-muted-foreground/80">
                    {timeAgo(item.createdAt)}
                  </span>
                </span>
                {!item.read && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            Barchasini ko&apos;rish
          </Link>
        </div>
      )}
    </div>
  );
}
