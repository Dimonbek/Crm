"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/form";

const initial: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="login">Login yoki email</Label>
        <Input
          id="login"
          name="login"
          type="text"
          required
          autoComplete="username"
          placeholder="login yoki siz@example.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Parol</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
            className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3 transition"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <FormMessage error={state.error} />

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Kirilmoqda..." : "Kirish"}
      </Button>
    </form>
  );
}
