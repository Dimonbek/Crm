"use client";

import { useState, useActionState, useRef, useEffect } from "react";
import {
  addLeadNoteAction,
  assignLeadAction,
  convertLeadToDealAction,
  markSoldAction,
  unmarkSoldAction,
  type ConvertState,
  type SoldState,
} from "./actions";
import { Modal, Field } from "@/components/ui";
import { formatMoney } from "@/lib/format";

const soldInitial: SoldState = {};

/** "Sotildi" — summa bilan. Reklama daromadi shundan hisoblanadi. */
export function SoldButton({
  leadId,
  sold,
  amount,
}: {
  leadId: string;
  sold: boolean;
  amount: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    markSoldAction.bind(null, leadId),
    soldInitial
  );
  const [undoing, setUndoing] = useState(false);

  if (sold) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-2.5">
        <span className="text-sm text-success">
          ✓ Sotildi{amount != null ? ` — ${formatMoney(amount)}` : ""}
        </span>
        <button
          disabled={undoing}
          onClick={async () => {
            if (!confirm("Sotuvni bekor qilasizmi?")) return;
            setUndoing(true);
            await unmarkSoldAction(leadId);
            setUndoing(false);
          }}
          className="text-xs text-muted underline transition hover:text-fg disabled:opacity-50"
        >
          bekor qilish
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        💰 Sotildi
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Sotuvni belgilash">
        <form
          action={(fd) => {
            formAction(fd);
          }}
          className="flex flex-col gap-3.5"
        >
          <p className="text-sm text-muted">
            Mijoz qancha to&apos;ladi? Bu summa reklama daromadiga qo&apos;shiladi.
          </p>
          <Field
            name="amount"
            label="Sotuv summasi (so'm) *"
            type="number"
            placeholder="12000000"
            required
          />
          {state.error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-fg"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saqlanmoqda..." : "Sotildi deb belgilash"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function AssignSelect({
  leadId,
  assignedToId,
  users,
}: {
  leadId: string;
  assignedToId: string | null;
  users: { id: string; name: string }[];
}) {
  const [pending, setPending] = useState(false);
  return (
    <select
      defaultValue={assignedToId ?? ""}
      disabled={pending}
      onChange={async (e) => {
        setPending(true);
        await assignLeadAction(leadId, e.target.value);
        setPending(false);
      }}
      className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-primary disabled:opacity-50"
    >
      <option value="">— Tayinlanmagan —</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  );
}

export function NoteForm({ leadId }: { leadId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = addLeadNoteAction.bind(null, leadId);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <textarea
        name="content"
        required
        rows={2}
        placeholder="Izoh yozing..."
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none transition focus:border-primary"
      />
      <button
        type="submit"
        className="self-end rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-fg transition hover:bg-primary-hover"
      >
        Qo&apos;shish
      </button>
    </form>
  );
}

const initial: ConvertState = {};

export function ConvertButton({
  leadId,
  disabled,
  defaultTitle,
}: {
  leadId: string;
  disabled?: boolean;
  defaultTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    convertLeadToDealAction.bind(null, leadId),
    initial
  );
  void disabled;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:border-primary/50 hover:text-fg"
      >
        + Kanbanга qo&apos;shish
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Bitim yaratish (Kanban)">
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field
            name="title"
            label="Bitim sarlavhasi *"
            defaultValue={defaultTitle}
            required
          />
          <Field
            name="amount"
            label="Summa (so'm)"
            type="number"
            placeholder="0"
          />
          {state.error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-fg"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Yaratilmoqda..." : "Yaratish"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
