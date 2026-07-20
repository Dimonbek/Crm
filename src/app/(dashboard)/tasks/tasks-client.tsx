"use client";

import { useEffect, useState, useActionState } from "react";
import {
  createTaskAction,
  setTaskStatusAction,
  deleteTaskAction,
  type CreateTaskState,
} from "./actions";
import { Modal, Field, SelectField, FormButtons } from "@/components/form";
import {
  TASK_STATUSES,
  TASK_STATUS_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
} from "@/lib/tasks";
import type { TaskStatus } from "@/generated/prisma/enums";

type Option = { id: string; name: string };
const initial: CreateTaskState = {};

export function AddTaskButton({ users }: { users: Option[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createTaskAction,
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
        + Yangi vazifa
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi vazifa">
        <form action={formAction} className="flex flex-col gap-3.5">
          <Field name="title" label="Sarlavha *" placeholder="Mijozga qo'ng'iroq qilish" required />
          <Field name="description" label="Tavsif" textarea placeholder="Tafsilotlar..." />
          <div className="grid grid-cols-2 gap-3">
            <Field name="dueDate" label="Muddat" type="date" />
            <SelectField
              name="priority"
              label="Prioritet"
              defaultValue="MEDIUM"
              options={PRIORITIES.map((p) => ({
                value: p,
                label: PRIORITY_LABEL[p],
              }))}
            />
          </div>
          <SelectField
            name="assignedToId"
            label="Mas'ul xodim"
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

export function TaskStatusSelect({
  taskId,
  status,
}: {
  taskId: string;
  status: TaskStatus;
}) {
  const [pending, setPending] = useState(false);
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={async (e) => {
        setPending(true);
        await setTaskStatusAction(taskId, e.target.value);
        setPending(false);
      }}
      className="rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs text-foreground outline-none transition focus:border-primary disabled:opacity-50"
    >
      {TASK_STATUSES.map((s) => (
        <option key={s} value={s}>
          {TASK_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      disabled={pending}
      onClick={async () => {
        if (!confirm("Vazifani o'chirasizmi?")) return;
        setPending(true);
        await deleteTaskAction(taskId);
        setPending(false);
      }}
      className="rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
    >
      🗑
    </button>
  );
}
