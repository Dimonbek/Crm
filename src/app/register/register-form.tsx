"use client";

import { useActionState, useState } from "react";
import { registerAction, type RegisterState } from "./actions";

const initial: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initial);
  const [showPassword, setShowPassword] = useState(false);

  const inputCls =
    "w-full rounded-lg border border-border bg-muted px-3.5 py-2.5 text-foreground outline-none transition focus:border-primary";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="company" className="text-sm text-muted-foreground">
          Kompaniya nomi
        </label>
        <input
          id="company"
          name="company"
          required
          placeholder="Riva Tour"
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm text-muted-foreground">
          Ismingiz
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Ism Familiya"
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-muted-foreground">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="siz@kompaniya.uz"
          className={inputCls}
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
            autoComplete="new-password"
            placeholder="kamida 6 ta belgi"
            className={`${inputCls} pr-11`}
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
        className="mt-1 inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "Yaratilmoqda..." : "Bepul boshlash"}
      </button>
    </form>
  );
}
