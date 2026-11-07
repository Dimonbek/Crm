"use client";

import { useEffect, useState, useActionState } from "react";
import { Trash2, Check, Copy } from "lucide-react";
import {
  createUserAction,
  toggleUserActiveAction,
  changeUserRoleAction,
  deleteUserAction,
  type CreateUserState,
} from "./actions";
import { Modal, Field, SelectField, FormButtons } from "@/components/form";
import { Button } from "@/components/ui/button";
import { ROLES, ROLE_LABEL } from "@/lib/roles";
import type { Role } from "@/generated/prisma/enums";

const initial: CreateUserState = {};

/** Rol nima qilishini odam tilida tushuntirish */
const ROLE_HINT: Record<Role, string> = {
  ADMIN: "Hamma narsani ko'radi, xodim qo'sha oladi va sozlamalarni o'zgartiradi",
  MANAGER: "Leadlar, mijozlar, bitimlar va vazifalar bilan ishlaydi",
  OPERATOR: "Qo'ng'iroq qiladi, lead va izohlarni yuritadi",
};

export function AddUserButton() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("MANAGER");
  const [state, formAction, pending] = useActionState(createUserAction, initial);

  // Muvaffaqiyatli yaratilganda modal yopilmaydi —
  // admin kirish ma'lumotlarini ko'chirib olishi kerak
  const created = state.created;

  function close() {
    setOpen(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Yangi xodim</Button>

      <Modal
        open={open}
        onClose={close}
        title={created ? "Xodim qo'shildi" : "Yangi xodim"}
      >
        {created ? (
          <Credentials
            name={created.name}
            login={created.login}
            password={created.password}
            onDone={close}
          />
        ) : (
          <form action={formAction} className="flex flex-col gap-3.5">
            <Field
              name="name"
              label="Ism *"
              placeholder="Aziza Karimova"
              required
            />
            <Field
              name="username"
              label="Login"
              placeholder="aziza — bo'sh qoldirsangiz ismdan yasaladi"
            />
            <Field
              name="email"
              label="Email"
              type="email"
              placeholder="shart emas"
            />
            <Field
              name="password"
              label="Parol"
              type="text"
              placeholder="bo'sh qoldirsangiz tizim o'zi yasaydi"
            />

            <div>
              <SelectField
                name="role"
                label="Rol"
                defaultValue="MANAGER"
                options={ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
                onChange={(v) => setRole(v as Role)}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {ROLE_HINT[role]}
              </p>
            </div>

            {state.error && (
              <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <FormButtons pending={pending} onCancel={close} />
          </form>
        )}
      </Modal>
    </>
  );
}

/** Yaratilgandan keyin — xodimga beriladigan kirish ma'lumotlari */
function Credentials({
  name,
  login,
  password,
  onDone,
}: {
  name: string;
  login: string;
  password: string;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const text = `${name}\nLogin: ${login}\nParol: ${password}`;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Bu parol boshqa ko&apos;rsatilmaydi — xodimga hozir yuboring.
      </p>

      <div className="rounded-lg border border-border bg-muted p-4 text-sm">
        <div className="font-medium">{name}</div>
        <div className="mt-2 flex justify-between gap-4">
          <span className="text-muted-foreground">Login</span>
          <code className="font-mono">{login}</code>
        </div>
        <div className="mt-1 flex justify-between gap-4">
          <span className="text-muted-foreground">Parol</span>
          <code className="font-mono">{password}</code>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? (
            <>
              <Check className="size-4" /> Nusxalandi
            </>
          ) : (
            <>
              <Copy className="size-4" /> Nusxalash
            </>
          )}
        </Button>
        <Button className="flex-1" onClick={onDone}>
          Yopish
        </Button>
      </div>
    </div>
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

/**
 * Xodimni butunlay o'chirish.
 * Leadlari o'chmaydi — "tayinlanmagan" bo'lib qoladi, shuni ogohlantiramiz.
 */
export function DeleteUserButton({
  userId,
  name,
  leadCount,
  disabled,
}: {
  userId: string;
  name: string;
  leadCount: number;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled || pending}
        title={disabled ? "O'zingizni o'chira olmaysiz" : "Xodimni o'chirish"}
        className="text-muted-foreground hover:text-destructive"
        onClick={async () => {
          const warn =
            leadCount > 0
              ? `\n\n${name} ga biriktirilgan ${leadCount} ta lead o'chmaydi — ular "tayinlanmagan" bo'lib qoladi.`
              : "";
          if (!confirm(`${name} hisobi butunlay o'chiriladi.${warn}\n\nDavom etamizmi?`)) {
            return;
          }
          setPending(true);
          const res = await deleteUserAction(userId);
          setPending(false);
          if (res.error) setError(res.error);
        }}
      >
        <Trash2 className="size-4" />
      </Button>

      {error && (
        <span className="ml-1 text-xs text-destructive" role="alert">
          {error}
        </span>
      )}
    </>
  );
}
