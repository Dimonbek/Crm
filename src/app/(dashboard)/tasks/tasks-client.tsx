"use client";

import { useEffect, useState, useActionState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  createTaskAction,
  setTaskStatusAction,
  deleteTaskAction,
  type CreateTaskState,
} from "./actions";
import {
  Modal,
  Field,
  SelectField,
  FormButtons,
  FormMessage,
  selectClass,
} from "@/components/form";
import { Button } from "@/components/ui/button";
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
  const [state, formAction, pending] = useActionState(createTaskAction, initial);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Yangi vazifa
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Yangi vazifa">
        <form action={formAction} className="flex flex-col gap-4">
          <Field
            name="title"
            label="Sarlavha *"
            placeholder="Mijozga qo'ng'iroq qilish"
            required
          />
          <Field
            name="description"
            label="Tavsif"
            textarea
            placeholder="Tafsilotlar..."
          />
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

          <FormMessage error={state.error} />
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
      className={`${selectClass} h-8 w-auto text-xs`}
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
    <Button
      variant="ghost"
      size="icon"
      disabled={pending}
      title="O'chirish"
      className="text-muted-foreground hover:text-destructive"
      onClick={async () => {
        if (!confirm("Vazifani o'chirasizmi?")) return;
        setPending(true);
        await deleteTaskAction(taskId);
        setPending(false);
      }}
    >
      <Trash2 className="size-4" />
    </Button>
  );
}
