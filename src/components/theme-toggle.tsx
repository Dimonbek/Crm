"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

/**
 * Kun/tun almashtirish (shadcn `.dark` sinfi).
 * Tanlov cookie'да saqlanadi — server sahifani darhol to'g'ri mavzuда chizadi.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const router = useRouter();

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);

    document.documentElement.classList.toggle("dark", next === "dark");
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;

    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Kunduzgi rejim" : "Tungi rejim"}
      title={theme === "dark" ? "Kunduzgi rejim" : "Tungi rejim"}
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  );
}
