"use client";

import { useEffect, useState, useActionState } from "react";
import { createContactAction, deleteContactAction, type ContactState } from "./actions";
import { Modal, Field, FormButtons } from "@/components/ui";

const initial: ContactState = {};

export function AddContactButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createContactAction,
    initial
  );

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition hover:bg-primary-hover"
      >
        + Yangi kontakt
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi kontakt">
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field name="name" label="Ism" placeholder="Ism Familiya" />
          <Field name="phone" label="Telefon *" placeholder="+998901234567" required />
          <Field name="email" label="Email" type="email" placeholder="mijoz@mail.uz" />
          <Field name="notes" label="Eslatma" textarea placeholder="Qo'shimcha ma'lumot..." />

          {state.error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}

          <FormButtons pending={pending} onCancel={() => setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}

export function DeleteContactButton({ contactId }: { contactId: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      disabled={pending}
      onClick={async () => {
        if (!confirm("Ushbu kontaktni o'chirasizmi?")) return;
        setPending(true);
        await deleteContactAction(contactId);
        setPending(false);
      }}
      className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition hover:border-danger/50 hover:text-danger disabled:opacity-50"
    >
      🗑
    </button>
  );
}
