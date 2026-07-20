"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Theme = "light" | "dark";

/**
 * Kun/tun almashtirish.
 * Tanlov cookie'да saqlanadi — server sahifani darhol to'g'ri mavzuда chizadi
 * (React hydration atributni o'chirib yubormaydi va miltillash bo'lmaydi).
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const router = useRouter();

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as Theme | undefined) ?? "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);

    // Darhol ko'rinishi uchun
    if (next === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }

    // Keyingi safar server shu bo'yicha chizadi (1 yil)
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;

    // Server komponentlarini yangi mavzu bilan qayta chizamiz
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Kunduzgi rejim" : "Tungi rejim"}
      title={theme === "dark" ? "Kunduzgi rejim" : "Tungi rejim"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted transition hover:border-fg/30 hover:text-fg"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
