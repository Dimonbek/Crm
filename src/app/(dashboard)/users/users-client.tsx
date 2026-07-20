"use client";

import { useEffect, useState, useActionState } from "react";
import {
  createUserAction,
  toggleUserActiveAction,
  changeUserRoleAction,
  type CreateUserState,
} from "./actions";
import { Modal, Field, SelectField, FormButtons } from "@/components/form";
import { ROLES, ROLE_LABEL } from "@/lib/roles";
import type { Role } from "@/generated/prisma/enums";

const initial: CreateUserState = {};

export function AddUserButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createUserAction,
    initial
  );

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
      >
        + Yangi foydalanuvchi
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi foydalanuvchi">
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field name="name" label="Ism *" placeholder="Ism Familiya" required />
          <Field
            name="email"
            label="Email *"
            type="email"
            placeholder="menejer@revator.uz"
            required
          />
          <Field
            name="password"
            label="Parol *"
            type="password"
            placeholder="kamida 6 ta belgi"
            required
          />
          <SelectField
            name="role"
            label="Rol"
            defaultValue="MANAGER"
            options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
          />

          {state.error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <FormButtons pending={pending} onCancel={() => setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: Role;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  return (
    <select
      defaultValue={role}
      disabled={disabled || pending}
      onChange={async (e) => {
        setPending(true);
        await changeUserRoleAction(userId, e.target.value);
        setPending(false);
      }}
      className="rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground outline-none transition focus:border-primary disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABEL[r]}
        </option>
      ))}
    </select>
  );
}

export function ActiveToggle({
  userId,
  active,
  disabled,
}: {
  userId: string;
  active: boolean;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      disabled={disabled || pending}
      onClick={async () => {
        setPending(true);
        await toggleUserActiveAction(userId);
        setPending(false);
      }}
      className={`rounded-full border px-2.5 py-0.5 text-xs transition disabled:opacity-40 ${
        active
          ? "border-success/30 bg-success/15 text-success"
          : "border-border bg-muted text-muted-foreground"
      }`}
    >
      {active ? "Faol" : "Bloklangan"}
    </button>
  );
}
