"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-fg">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
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
  const cls =
    "rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-primary";
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm text-muted">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          rows={3}
          className={cls}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          min={type === "number" ? 0 : undefined}
          className={cls}
        />
      )}
    </div>
  );
}

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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm text-muted">
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none transition focus:border-primary"
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
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-fg"
      >
        Bekor qilish
      </button>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Saqlanmoqda..." : submitLabel}
      </button>
    </div>
  );
}
