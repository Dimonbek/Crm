"use client";

import { useEffect, useState, useActionState } from "react";
import {
  createContactAction,
  updateContactAction,
  type ContactState,
} from "./actions";
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
        + Yangi mijoz
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi mijoz">
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field name="name" label="Ism" placeholder="Aziz Rahimov" />
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
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:border-primary/50 hover:text-fg"
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
