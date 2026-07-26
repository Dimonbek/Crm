"use client";

import { useState, useTransition } from "react";
import { setDealsEnabledAction, setCurrencyAction } from "./section-actions";

export function DealsToggle({
  initial,
  disabled,
}: {
  initial: boolean;
  disabled?: boolean;
}) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function flip() {
    const next = !enabled;
    setEnabled(next); // optimistik
    setErr(null);
    startTransition(async () => {
      try {
        await setDealsEnabledAction(next);
      } catch (e) {
        setEnabled(!next); // xato bo'lsa qaytaramiz
        setErr(e instanceof Error ? e.message : "Xato yuz berdi");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">Bitimlar (Kanban) bo&apos;limi</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {enabled
            ? "Menyuda ko'rinadi"
            : "Menyudan vaqtincha yashirilgan"}
          {err && <span className="text-destructive"> — {err}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={flip}
        disabled={disabled || pending}
        aria-pressed={enabled}
        aria-label="Bitimlar bo'limini yoqish/o'chirish"
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
          enabled ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            enabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function CurrencySelect({
  initial,
  disabled,
}: {
  initial: string;
  disabled?: boolean;
}) {
  const [currency, setCurrency] = useState(initial === "USD" ? "USD" : "UZS");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function change(next: string) {
    const prev = currency;
    setCurrency(next); // optimistik
    setErr(null);
    startTransition(async () => {
      try {
        await setCurrencyAction(next);
      } catch (e) {
        setCurrency(prev);
        setErr(e instanceof Error ? e.message : "Xato yuz berdi");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">Pul valyutasi</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          Byudjet, daromad va foyda shu valyutada ko&apos;rinadi (konvertatsiya
          yo&apos;q — faqat belgi)
          {err && <span className="text-destructive"> — {err}</span>}
        </div>
      </div>
      <select
        value={currency}
        onChange={(e) => change(e.target.value)}
        disabled={disabled || pending}
        className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm outline-none transition focus:border-primary disabled:opacity-50"
      >
        <option value="UZS">so&apos;m (UZS)</option>
        <option value="USD">dollar ($)</option>
      </select>
    </div>
  );
}
