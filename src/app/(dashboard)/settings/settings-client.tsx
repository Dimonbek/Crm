"use client";

import { useState } from "react";

export function CopyField({
  label,
  value,
  secret,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [shown, setShown] = useState(!secret);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard ruxsati yo'q */
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-muted">{label}</label>
      <div className="flex gap-2">
        <input
          readOnly
          type={shown ? "text" : "password"}
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-sm text-fg outline-none"
        />
        {secret && (
          <button
            onClick={() => setShown((v) => !v)}
            className="rounded-lg border border-border px-3 text-sm text-muted transition hover:text-fg"
            aria-label={shown ? "Yashirish" : "Ko'rsatish"}
          >
            {shown ? "🙈" : "👁"}
          </button>
        )}
        <button
          onClick={copy}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:border-primary hover:text-fg"
        >
          {copied ? "✓ Nusxalandi" : "Nusxalash"}
        </button>
      </div>
    </div>
  );
}
