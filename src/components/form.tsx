"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Modal — shadcn Dialog ustiga qurilgan (eski API saqlangan) */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  name,
  label,
  type = "text",
  placeholder,
  defaultValue,
  required,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  textarea?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      {textarea ? (
        <Textarea
          id={name}
          name={name}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          rows={3}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          min={type === "number" ? 0 : undefined}
        />
      )}
    </div>
  );
}

/**
 * Native <select> — shadcn uslubida.
 * Radix Select emas, chunki formalar FormData bilan yuboriladi
 * va native select mobil qurilmalarda qulayroq.
 */
export const selectClass = cn(
  "border-input bg-transparent dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export function SelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className={selectClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormButtons({
  pending,
  onCancel,
  submitLabel = "Saqlash",
}: {
  pending: boolean;
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="mt-2 flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Bekor qilish
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? "Saqlanmoqda..." : submitLabel}
      </Button>
    </div>
  );
}

/** Xato/muvaffaqiyat xabari */
export function FormMessage({
  error,
  ok,
}: {
  error?: string;
  ok?: string;
}) {
  if (error) {
    return (
      <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p className="border-success/40 bg-success/10 text-success rounded-md border px-3 py-2 text-sm">
        ✓ {ok}
      </p>
    );
  }
  return null;
}
