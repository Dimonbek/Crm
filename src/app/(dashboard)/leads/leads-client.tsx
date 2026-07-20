"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Trash2, Plus, X } from "lucide-react";
import {
  createLeadAction,
  updateLeadStatusAction,
  deleteLeadAction,
  markLeadSoldAction,
  unmarkLeadSoldAction,
  type CreateLeadState,
} from "./actions";
import { formatMoney } from "@/lib/format";
import { SELECTABLE_STATUSES, STATUS_LABEL, STATUS_CLASS } from "@/lib/leads";
import type { LeadStatus } from "@/generated/prisma/enums";
import {
  Modal,
  Field,
  FormButtons,
  FormMessage,
  selectClass,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const initial: CreateLeadState = {};

export function AddLeadButton() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createLeadAction, initial);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Yangi lead
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Yangi lead qo'shish"
      >
        <form action={formAction} className="flex flex-col gap-4">
          <Field name="phone" label="Telefon *" placeholder="+998901234567" required />
          <Field
            name="destination"
            label="Manzil *"
            placeholder="Turkiya, Antalya"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Field name="travelDate" label="Sana" type="date" />
            <Field
              name="travelers"
              label="Necha kishi"
              type="number"
              defaultValue="1"
            />
          </div>
          <Field
            name="contactTime"
            label="Bog'lanish vaqti"
            placeholder="14:00-18:00"
          />

          <FormMessage error={state.error} />
          <FormButtons pending={pending} onCancel={() => setOpen(false)} />
        </form>
      </Modal>
    </>
  );
}

export function StatusSelect({
  leadId,
  status,
  saleAmount,
}: {
  leadId: string;
  status: LeadStatus;
  saleAmount?: number | null;
}) {
  const [pending, setPending] = useState(false);
  const [askAmount, setAskAmount] = useState(false);
  const [amount, setAmount] = useState("");

  // Sotilgan bo'lsa — summa bilan ko'rsatamiz
  if (status === "CONVERTED") {
    return (
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className={STATUS_CLASS.CONVERTED}>
          {STATUS_LABEL.CONVERTED}
          {saleAmount != null ? ` · ${formatMoney(saleAmount)}` : ""}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          disabled={pending}
          title="Sotuvni bekor qilish"
          onClick={async () => {
            if (!confirm("Sotuvni bekor qilasizmi?")) return;
            setPending(true);
            await unmarkLeadSoldAction(leadId);
            setPending(false);
          }}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={status}
        disabled={pending}
        onChange={async (e) => {
          setPending(true);
          await updateLeadStatusAction(leadId, e.target.value);
          setPending(false);
        }}
        className={`${selectClass} h-8 w-auto text-xs`}
      >
        {SELECTABLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      <Button
        variant="outline"
        size="sm"
        className="text-success border-success/40 hover:bg-success/10 h-8"
        onClick={() => {
          setAmount("");
          setAskAmount(true);
        }}
      >
        Sotildi
      </Button>

      <Modal
        open={askAmount}
        onClose={() => setAskAmount(false)}
        title="Sotuvni belgilash"
      >
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Mijoz qancha to&apos;ladi? Bu summa reklama daromadiga
            qo&apos;shiladi.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sale-amount">Sotuv summasi (so&apos;m)</Label>
            <Input
              id="sale-amount"
              autoFocus
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="12000000"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAskAmount(false)}>
              Bekor qilish
            </Button>
            <Button
              disabled={pending || amount === "" || Number(amount) < 0}
              onClick={async () => {
                setPending(true);
                await markLeadSoldAction(leadId, Number(amount));
                setPending(false);
                setAskAmount(false);
              }}
            >
              {pending ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function DeleteLeadButton({ leadId }: { leadId: string }) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      title="O'chirish"
      className="text-muted-foreground hover:text-destructive"
      onClick={async () => {
        if (!confirm("Ushbu leadni o'chirasizmi?")) return;
        setPending(true);
        await deleteLeadAction(leadId);
        setPending(false);
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
