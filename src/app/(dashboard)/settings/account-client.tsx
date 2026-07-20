"use client";

import { useActionState, useState } from "react";
import {
  updateProfileAction,
  changePasswordAction,
  type AccountState,
} from "./account-actions";

const initial: AccountState = {};

const inputCls =
  "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-primary";

export function ProfileForm({
  name,
  email,
  disabled,
}: {
  name: string;
  email: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initial
  );

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm text-muted">
            Ismingiz
          </label>
          <input
            id="name"
            name="name"
            defaultValue={name}
            required
            disabled={disabled}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm text-muted">
            Login (email)
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            required
            disabled={disabled}
            className={inputCls}
          />
        </div>
      </div>

      <Feedback state={state} />

      <button
        type="submit"
        disabled={pending || disabled}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Saqlanmoqda..." : "Saqlash"}
      </button>
    </form>
  );
}

export function PasswordForm({ disabled }: { disabled?: boolean }) {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initial
  );
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="current" className="text-sm text-muted">
          Joriy parol
        </label>
        <div className="relative">
          <input
            id="current"
            name="current"
            type={show ? "text" : "password"}
            required
            disabled={disabled}
            autoComplete="current-password"
            className={`${inputCls} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Yashirish" : "Ko'rsatish"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted transition hover:text-fg"
          >
            {show ? "🙈" : "👁"}
          </button>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="next" className="text-sm text-muted">
            Yangi parol
          </label>
          <input
            id="next"
            name="next"
            type={show ? "text" : "password"}
            required
            disabled={disabled}
            autoComplete="new-password"
            placeholder="kamida 6 ta belgi"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm" className="text-sm text-muted">
            Yangi parolni takrorlang
          </label>
          <input
            id="confirm"
            name="confirm"
            type={show ? "text" : "password"}
            required
            disabled={disabled}
            autoComplete="new-password"
            className={inputCls}
          />
        </div>
      </div>

      <Feedback state={state} />

      <button
        type="submit"
        disabled={pending || disabled}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "O'zgartirilmoqda..." : "Parolni o'zgartirish"}
      </button>
    </form>
  );
}

function Feedback({ state }: { state: AccountState }) {
  if (state.error) {
    return (
      <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p className="rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
        ✓ {state.ok}
      </p>
    );
  }
  return null;
}
