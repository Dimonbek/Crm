"use client";

import { useEffect, useState, useActionState } from "react";
import {
  createDealAction,
  moveDealStageAction,
  deleteDealAction,
  type CreateDealState,
} from "./actions";
import { DEAL_STAGES, STAGE_LABEL, STAGE_ACCENT } from "@/lib/deals";
import { formatMoney } from "@/lib/format";
import { Modal, Field, SelectField, FormButtons } from "@/components/form";
import type { DealStage } from "@/generated/prisma/enums";

export type DealCard = {
  id: string;
  title: string;
  amount: number | null;
  stage: DealStage;
  contactName: string | null;
  assigneeName: string | null;
};

type Option = { id: string; name: string };

export function Kanban({
  initialDeals,
  contacts,
  users,
}: {
  initialDeals: DealCard[];
  contacts: Option[];
  users: Option[];
}) {
  const [deals, setDeals] = useState<DealCard[]>(initialDeals);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);

  // Server yangilanganda mahalliy holatni sinxronlash
  useEffect(() => {
    setDeals(initialDeals);
  }, [initialDeals]);

  async function handleDrop(stage: DealStage) {
    setOverStage(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const current = deals.find((d) => d.id === id);
    if (!current || current.stage === stage) return;

    // Optimistik
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stage } : d))
    );
    await moveDealStageAction(id, stage);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bitimlar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jami {deals.length} ta bitim · kartani ustunlar orasida suring
          </p>
        </div>
        <AddDealButton contacts={contacts} users={users} />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {DEAL_STAGES.map((stage) => {
          const items = deals.filter((d) => d.stage === stage);
          const sum = items.reduce((acc, d) => acc + (d.amount ?? 0), 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(stage);
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={() => handleDrop(stage)}
              className={`flex w-72 shrink-0 flex-col rounded-2xl border border-t-2 border-border bg-card/50 ${STAGE_ACCENT[stage]} ${
                overStage === stage ? "ring-2 ring-primary/40" : ""
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">
                  {STAGE_LABEL[stage]}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>
              {sum > 0 && (
                <div className="px-4 pb-2 text-xs text-muted-foreground">
                  {formatMoney(sum)}
                </div>
              )}
              <div className="flex min-h-[120px] flex-col gap-2 p-2">
                {items.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={() => setDragId(deal.id)}
                    onDragEnd={() => setDragId(null)}
                    className={`group cursor-grab rounded-xl border border-border bg-card p-3 active:cursor-grabbing ${
                      dragId === deal.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">{deal.title}</div>
                      <DeleteDeal id={deal.id} />
                    </div>
                    {deal.amount != null && (
                      <div className="mt-1 text-sm text-success">
                        {formatMoney(deal.amount)}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      {deal.contactName && (
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          {deal.contactName}
                        </span>
                      )}
                      {deal.assigneeName && (
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          👤 {deal.assigneeName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeleteDeal({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      disabled={pending}
      onClick={async () => {
        if (!confirm("Bitimni o'chirasizmi?")) return;
        setPending(true);
        await deleteDealAction(id);
        setPending(false);
      }}
      className="text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
    >
      ✕
    </button>
  );
}

const initial: CreateDealState = {};

function AddDealButton({
  contacts,
  users,
}: {
  contacts: Option[];
  users: Option[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createDealAction,
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
        + Yangi bitim
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi bitim">
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field name="title" label="Sarlavha *" placeholder="Antalya tur paketi" required />
          <Field name="amount" label="Summa (so'm)" type="number" placeholder="0" />
          <SelectField
            name="stage"
            label="Bosqich"
            defaultValue="QUALIFICATION"
            options={DEAL_STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }))}
          />
          <SelectField
            name="contactId"
            label="Kontakt"
            options={[
              { value: "", label: "— Yo'q —" },
              ...contacts.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          <SelectField
            name="assignedToId"
            label="Mas'ul menejer"
            options={[
              { value: "", label: "— Tayinlanmagan —" },
              ...users.map((u) => ({ value: u.id, label: u.name })),
            ]}
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
