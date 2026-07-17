"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Boshqaruv paneli", icon: "◧" },
  { href: "/leads", label: "Leadlar", icon: "◎" },
  { href: "/contacts", label: "Kontaktlar", icon: "☰" },
  { href: "/deals", label: "Bitimlar", icon: "▤" },
  { href: "/tasks", label: "Vazifalar", icon: "✓" },
];

const adminNav = [{ href: "/users", label: "Xodimlar", icon: "◆" }];
const commonNav = [{ href: "/settings", label: "Sozlamalar", icon: "⚙" }];

export function Sidebar({
  role,
  orgName,
}: {
  role: string;
  orgName: string;
}) {
  const pathname = usePathname();
  const items =
    role === "ADMIN" ? [...nav, ...adminNav, ...commonNav] : [...nav, ...commonNav];

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-fg">
          {orgName.slice(0, 1).toUpperCase()}
        </div>
        <span className="truncate font-semibold" title={orgName}>
          {orgName}
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-primary/15 text-fg"
                  : "text-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              <span className="w-4 text-center text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
