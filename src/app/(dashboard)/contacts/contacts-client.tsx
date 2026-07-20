"use client";

import { useEffect, useState, useActionState } from "react";
import {
  createContactAction,
  updateContactAction,
  type ContactState,
} from "./actions";
import { Modal, Field, FormButtons } from "@/components/form";

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
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        + Yangi mijoz
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi mijoz">
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field name="name" label="Ism" placeholder="Aziz Rahimov" />
          <Field name="phone" label="Telefon *" placeholder="+998901234567" required />
          <Field name="email" label="Email" type="email" placeholder="mijoz@mail.uz" />
          <Field name="notes" label="Eslatma" textarea placeholder="Qo'shimcha ma'lumot..." />

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

export function EditContactButton({
  contactId,
  name,
  email,
  notes,
}: {
  contactId: string;
  name: string | null;
  email: string | null;
  notes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateContactAction.bind(null, contactId),
    initial
  );

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
      >
        ✎ Tahrirlash
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Mijoz ma'lumoti">
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field name="name" label="Ism" defaultValue={name ?? ""} placeholder="Aziz Rahimov" />
          <Field
            name="email"
            label="Email"
            type="email"
            defaultValue={email ?? ""}
            placeholder="mijoz@mail.uz"
          />
          <Field
            name="notes"
            label="Eslatma"
            textarea
            defaultValue={notes ?? ""}
            placeholder="Masalan: dengizni yaxshi ko'radi, bolalari bilan sayohat qiladi"
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
