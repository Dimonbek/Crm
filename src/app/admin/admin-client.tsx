"use client";

import { useEffect, useState, useActionState } from "react";
import {
  createOrgAction,
  setBotUsernameAction,
  regenerateTokenAction,
  resetPasswordAction,
  deleteOrgAction,
  viewAsOrgAction,
  type AdminState,
} from "./actions";
import { Modal, Field, FormButtons } from "@/components/ui";

/** Kompaniya ichiga kirish — uning CRM'ini ko'rish */
export function ViewOrgButton({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await viewAsOrgAction(orgId);
      }}
      className="text-left font-medium transition hover:text-primary disabled:opacity-60"
      title={`${orgName} CRM'ini ochish`}
    >
      {pending ? "Ochilmoqda..." : orgName}
    </button>
  );
}

/** Kompaniyani butunlay o'chirish — nom yozib tasdiqlanadi */
export function DeleteOrgButton({
  orgId,
  orgName,
  leadCount,
}: {
  orgId: string;
  orgName: string;
  leadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const match = name.trim() === orgName.trim();

  return (
    <>
      <button
        onClick={() => {
          setName("");
          setError(null);
          setOpen(true);
        }}
        className="rounded border border-border px-2 py-1 text-xs text-muted transition hover:border-danger/50 hover:text-danger"
        title="Kompaniyani o'chirish"
      >
        🗑
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Kompaniyani o'chirish"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            <b>{orgName}</b> va uning barcha ma&apos;lumoti butunlay
            o&apos;chadi: {leadCount} lead, mijozlar, bitimlar, xodimlar.
            <div className="mt-1.5">Buni qaytarib bo&apos;lmaydi.</div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-muted">
              Tasdiqlash uchun kompaniya nomini yozing:
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={orgName}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition focus:border-danger"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-fg"
            >
              Bekor qilish
            </button>
            <button
              disabled={!match || pending}
              onClick={async () => {
                setPending(true);
                setError(null);
                const res = await deleteOrgAction(orgId, name);
                setPending(false);
                if (res?.error) setError(res.error);
                else setOpen(false);
              }}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {pending ? "O'chirilmoqda..." : "Butunlay o'chirish"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

const initial: AdminState = {};

export function AddOrgButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createOrgAction, initial);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition hover:bg-primary-hover"
      >
        + Yangi kompaniya
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Mijoz uchun CRM yaratish"
      >
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field
            name="company"
            label="Kompaniya nomi *"
            placeholder="Mir Sun Travel"
            required
          />
          <Field
            name="botUsername"
            label="Telegram bot (ixtiyoriy)"
            placeholder="MirSunTravelBot"
          />
          <div className="my-1 border-t border-border pt-3 text-sm text-muted">
            Mijoz shu ma&apos;lumotlar bilan kiradi:
          </div>
          <Field
            name="adminName"
            label="Mas'ul shaxs *"
            placeholder="Ism Familiya"
            required
          />
          <Field
            name="email"
            label="Email *"
            type="email"
            placeholder="mijoz@kompaniya.uz"
            required
          />
          <Field
            name="username"
            label="Qisqa login (ixtiyoriy)"
            placeholder="mirsun — email o'rniga shu bilan ham kiradi"
          />
          <Field
            name="password"
            label="Parol *"
            placeholder="kamida 6 ta belgi"
            required
          />

          {state.error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}

          <FormButtons
            pending={pending}
            onCancel={() => setOpen(false)}
            submitLabel="Yaratish"
          />
        </form>
      </Modal>
    </>
  );
}

export function BotCell({
  orgId,
  botUsername,
}: {
  orgId: string;
  botUsername: string | null;
}) {
  const [value, setValue] = useState(botUsername ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (value === (botUsername ?? "")) return;
    setSaving(true);
    await setBotUsernameAction(orgId, value);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted">@</span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        disabled={saving}
        placeholder="bot username"
        className="w-40 rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm outline-none transition focus:border-primary disabled:opacity-50"
      />
      {saved && <span className="text-xs text-success">✓</span>}
    </div>
  );
}

/** Bot env uchun tayyor sozlama — nusxalab qo'yiladi */
export function BotEnvButton({
  orgName,
  webhookUrl,
  token,
}: {
  orgName: string;
  webhookUrl: string;
  token: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const envText = `CRM_WEBHOOK_URL=${webhookUrl}\nCRM_WEBHOOK_SECRET=${token}`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-border px-2 py-1 text-xs text-muted transition hover:border-primary hover:text-fg"
      >
        🔑 Bot sozlamasi
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${orgName} — botni ulash`}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Shu 2 qatorni botning Railway <b className="text-fg">Variables</b>{" "}
            bo&apos;limiga qo&apos;ying — bot leadlarni shu kompaniyaga yubora
            boshlaydi.
          </p>

          <pre className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-3 text-xs text-fg">
            {envText}
          </pre>

          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(envText);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                /* ruxsat yo'q */
              }
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition hover:bg-primary-hover"
          >
            {copied ? "✓ Nusxalandi" : "Ikkalasini nusxalash"}
          </button>

          <p className="text-xs text-muted">
            Kalit maxfiy — faqat siz va o&apos;sha bot bilishi kerak.
          </p>
        </div>
      </Modal>
    </>
  );
}

export function RegenerateButton({ orgId }: { orgId: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      disabled={pending}
      onClick={async () => {
        if (
          !confirm(
            "Kalitni yangilaysizmi? Eski kalit ishlamay qoladi — botga yangisini qo'yish kerak."
          )
        )
          return;
        setPending(true);
        await regenerateTokenAction(orgId);
        setPending(false);
      }}
      className="rounded border border-border px-2 py-1 text-xs text-muted transition hover:border-warning/50 hover:text-warning disabled:opacity-50"
      title="Kalitni yangilash"
    >
      ↻
    </button>
  );
}

export function ResetPasswordButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      disabled={pending || !userId}
      onClick={async () => {
        const pw = prompt(`${email} uchun yangi parol (kamida 6 belgi):`);
        if (!pw || pw.length < 6) return;
        setPending(true);
        await resetPasswordAction(userId, pw);
        setPending(false);
        alert("Parol yangilandi");
      }}
      className="rounded border border-border px-2 py-1 text-xs text-muted transition hover:border-primary hover:text-fg disabled:opacity-40"
      title="Parolni yangilash"
    >
      🔒
    </button>
  );
}
