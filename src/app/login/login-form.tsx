"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="siz@example.com"
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-fg outline-none transition focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-muted">
          Parol
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-fg outline-none transition focus:border-primary"
        />
      </div>

      {state.error && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-fg transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Kirilmoqda..." : "Kirish"}
      </button>
    </form>
  );
}
