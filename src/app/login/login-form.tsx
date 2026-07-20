"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login" className="text-sm text-muted-foreground">
          Login yoki email
        </label>
        <input
          id="login"
          name="login"
          type="text"
          required
          autoComplete="username"
          placeholder="login yoki siz@example.com"
          className="rounded-lg border border-border bg-muted px-3.5 py-2.5 text-foreground outline-none transition focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm text-muted-foreground">
          Parol
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-border bg-muted px-3.5 py-2.5 pr-11 text-foreground outline-none transition focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "Kirilmoqda..." : "Kirish"}
      </button>
    </form>
  );
}
