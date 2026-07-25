"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { navItemsFor } from "./sidebar";

// Mobil navigatsiya: header'dagi hamburger tugma + chapdan chiqadigan drawer.
// Desktopда yashirin (md:hidden) — u yerda oddiy Sidebar ishlaydi.
export function MobileNav({
  role,
  orgName,
  dealsEnabled = true,
}: {
  role: string;
  orgName?: string;
  dealsEnabled?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navItemsFor(role, { dealsEnabled });
  const label = orgName?.trim() || "CRM";

  // Sahifa o'zgarganda drawer yopiladi
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Drawer ochiqda fon scroll bo'lmasin
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Menyu"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-lg text-foreground transition hover:bg-muted"
      >
        ☰
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 max-w-[80%] flex-col border-r border-border bg-card shadow-xl">
            <div className="flex h-16 shrink-0 items-center justify-between gap-2.5 border-b border-border px-5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                  {label.slice(0, 1).toUpperCase()}
                </div>
                <span className="truncate font-semibold" title={label}>
                  {label}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Yopish"
                className="px-1 text-xl leading-none text-muted-foreground transition hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <nav className="flex flex-col gap-1 overflow-y-auto p-3">
              {items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="w-4 text-center text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
