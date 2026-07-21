"use client";

import { useEffect, useState, useActionState } from "react";
import { Plus, X, User } from "lucide-react";
import {
  createDealAction,
  moveDealStageAction,
  deleteDealAction,
  type CreateDealState,
} from "./actions";
import { DEAL_STAGES, STAGE_LABEL, STAGE_ACCENT } from "@/lib/deals";
import { formatMoney } from "@/lib/format";
import {
  Modal,
  Field,
  SelectField,
  FormButtons,
  FormMessage,
} from "@/components/form";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, stage } : d)));
    await moveDealStageAction(id, stage);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bitimlar"
        description={`Jami ${deals.length} ta bitim · kartani ustunlar orasida suring`}
        action={<AddDealButton contacts={contacts} users={users} />}
      />

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
              className={cn(
                "bg-muted/40 flex w-72 shrink-0 flex-col rounded-xl border border-t-2",
                STAGE_ACCENT[stage],
                overStage === stage && "ring-ring/50 ring-2"
              )}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{STAGE_LABEL[stage]}</span>
                <Badge variant="secondary" className="tabular-nums">
                  {items.length}
                </Badge>
              </div>
              {sum > 0 && (
                <div className="text-muted-foreground px-4 pb-2 text-xs tabular-nums">
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
                    className={cn(
                      "bg-card group cursor-grab rounded-lg border p-3 shadow-xs transition-shadow hover:shadow-sm active:cursor-grabbing",
                      dragId === deal.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">{deal.title}</div>
                      <DeleteDeal id={deal.id} />
                    </div>
                    {deal.amount != null && (
                      <div className="text-success mt-1 text-sm font-medium tabular-nums">
                        {formatMoney(deal.amount)}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {deal.contactName && (
                        <Badge variant="secondary" className="font-normal">
                          {deal.contactName}
                        </Badge>
                      )}
                      {deal.assigneeName && (
                        <Badge variant="secondary" className="font-normal">
                          <User className="size-3" />
                          {deal.assigneeName}
                        </Badge>
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
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      title="Bitimni o'chirish"
      className="text-muted-foreground hover:text-destructive size-6 opacity-0 transition group-hover:opacity-100"
      onClick={async () => {
        if (!confirm("Bitimni o'chirasizmi?")) return;
        setPending(true);
        await deleteDealAction(id);
        setPending(false);
      }}
    >
      <X className="size-3.5" />
    </Button>
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
  const [state, formAction, pending] = useActionState(createDealAction, initial);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Yangi bitim
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi bitim">
        <form action={formAction} className="flex flex-col gap-4">
          <Field
            name="title"
            label="Sarlavha *"
            placeholder="Antalya tur paketi"
            required
          />
          <Field
            name="amount"
            label="Summa (so'm)"
            type="number"
            placeholder="0"
          />
          <SelectField
            name="stage"
            label="Bosqich"
            defaultValue="QUALIFICATION"
            options={DEAL_STAGES.map((s) => ({
              value: s,
              label: STAGE_LABEL[s],
            }))}
          />
          <SelectField
            name="contactId"
            label="Mijoz"
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

          <FormMessage error={state.error} />
          <FormButtons pending={pending} onCancel={() => setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}
