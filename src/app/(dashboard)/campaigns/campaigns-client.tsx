"use client";

import { useEffect, useState, useActionState } from "react";
import {
  createCampaignAction,
  updateBudgetAction,
  deleteCampaignAction,
  toggleCampaignAction,
  saveBotUsernameAction,
  type CampaignState,
} from "./actions";
import { Modal, Field, FormButtons } from "@/components/ui";

const initial: CampaignState = {};

export function AddCampaignButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createCampaignAction,
    initial
  );

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition hover:bg-primary-hover"
      >
        + Yangi kampaniya
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi kampaniya">
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field name="name" label="Nomi *" placeholder="Instagram iyul" required />
          <Field
            name="code"
            label="Kod (havola uchun)"
            placeholder="insta_iyul — bo'sh qoldirsangiz nomdan yasaladi"
          />
          <Field name="channel" label="Kanal" placeholder="Instagram" />
          <Field
            name="budget"
            label="Sarflangan byudjet (so'm)"
            type="number"
            placeholder="0 — keyin ham kiritish mumkin"
          />

          {state.error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}

          <FormButtons pending={pending} onCancel={() => setOpen(false)} submitLabel="Yaratish" />
        </form>
      </Modal>
    </>
  );
}

/** Byudjetni joyida tahrirlash — reklama davom etsa pul qo'shib boriladi */
export function BudgetCell({
  campaignId,
  budget,
}: {
  campaignId: string;
  budget: number;
}) {
  const [value, setValue] = useState(String(budget));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n === budget) {
      setValue(String(budget));
      return;
    }
    setSaving(true);
    await updateBudgetAction(campaignId, n);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        disabled={saving}
        inputMode="numeric"
        className="w-28 rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm text-fg outline-none transition focus:border-primary disabled:opacity-50"
      />
      {saved && <span className="text-xs text-success">✓</span>}
    </div>
  );
}

export function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* ruxsat yo'q */
        }
      }}
      title={link}
      className="rounded border border-border px-2 py-1 text-xs text-muted transition hover:border-primary hover:text-fg"
    >
      {copied ? "✓ Nusxalandi" : "🔗 Havola"}
    </button>
  );
}

export function CampaignRowActions({
  campaignId,
  active,
}: {
  campaignId: string;
  active: boolean;
}) {
  const [pending, setPending] = useState(false);
  return (
    <div className="flex justify-end gap-1.5">
      <button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await toggleCampaignAction(campaignId);
          setPending(false);
        }}
        className={`rounded-full border px-2 py-0.5 text-xs transition disabled:opacity-40 ${
          active
            ? "border-success/30 bg-success/15 text-success"
            : "border-border bg-surface-2 text-muted"
        }`}
      >
        {active ? "Faol" : "To'xtatilgan"}
      </button>
      <button
        disabled={pending}
        onClick={async () => {
          if (!confirm("Kampaniyani o'chirasizmi? Leadlar o'chmaydi.")) return;
          setPending(true);
          await deleteCampaignAction(campaignId);
          setPending(false);
        }}
        className="rounded border border-border px-2 py-1 text-xs text-muted transition hover:border-danger/50 hover:text-danger disabled:opacity-50"
      >
        🗑
      </button>
    </div>
  );
}

export function BotUsernameForm({ current }: { current: string | null }) {
  const [state, formAction, pending] = useActionState(
    saveBotUsernameAction,
    initial
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (state.ok) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state.ok]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="botUsername" className="text-sm text-muted">
          Telegram bot username
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-muted">@</span>
          <input
            id="botUsername"
            name="botUsername"
            defaultValue={current ?? ""}
            placeholder="RivaTourBot"
            className="w-56 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-primary"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:border-primary hover:text-fg disabled:opacity-60"
      >
        {pending ? "..." : "Saqlash"}
      </button>
      {saved && <span className="pb-2 text-sm text-success">✓ Saqlandi</span>}
      {state.error && (
        <span className="pb-2 text-sm text-danger">{state.error}</span>
      )}
    </form>
  );
}
