"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import {
  createLeadAction,
  updateLeadStatusAction,
  deleteLeadAction,
  type CreateLeadState,
} from "./actions";
import { LEAD_STATUSES, STATUS_LABEL } from "@/lib/leads";
import type { LeadStatus } from "@/generated/prisma/enums";

const initial: CreateLeadState = {};

export function AddLeadButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createLeadAction,
    initial
  );

  // Muvaffaqiyatli qo'shilsa — modalni yopish
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition hover:bg-primary-hover"
      >
        + Yangi lead
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Yangi lead qo&apos;shish</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted hover:text-fg"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="flex flex-col gap-3.5">
              <Field name="phone" label="Telefon *" placeholder="+998901234567" />
              <Field
                name="destination"
                label="Manzil *"
                placeholder="Turkiya, Antalya"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field name="travelDate" label="Sana" type="date" />
                <Field
                  name="travelers"
                  label="Necha kishi"
                  type="number"
                  defaultValue="1"
                />
              </div>
              <Field
                name="contactTime"
                label="Bog'lanish vaqti"
                placeholder="14:00-18:00"
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
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition hover:bg-primary-hover disabled:opacity-60"
                >
                  {pending ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={type === "number" ? 1 : undefined}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-primary"
      />
    </div>
  );
}

export function StatusSelect({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const [pending, setPending] = useState(false);

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={async (e) => {
        setPending(true);
        await updateLeadStatusAction(leadId, e.target.value);
        setPending(false);
      }}
      className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-fg outline-none transition focus:border-primary disabled:opacity-50"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      disabled={pending}
      onClick={async () => {
        if (!confirm("Ushbu leadni o'chirasizmi?")) return;
        setPending(true);
        await deleteLeadAction(leadId);
        setPending(false);
      }}
      className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition hover:border-danger/50 hover:text-danger disabled:opacity-50"
      title="O'chirish"
    >
      🗑
    </button>
  );
}
