import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import {
  TASK_STATUSES,
  TASK_STATUS_LABEL,
  PRIORITY_LABEL,
  PRIORITY_CLASS,
} from "@/lib/tasks";
import type { TaskStatus } from "@/generated/prisma/enums";
import { AddTaskButton, TaskStatusSelect, DeleteTaskButton } from "./tasks-client";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { orgId } = await currentOrg();
  const { status } = await searchParams;

  const statusFilter =
    status && TASK_STATUSES.includes(status as TaskStatus)
      ? (status as TaskStatus)
      : undefined;

  const [tasks, users] = await Promise.all([
    prisma.task.findMany({
      where: { organizationId: orgId, status: statusFilter },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: { assignedTo: { select: { name: true } } },
    }),
    prisma.user.findMany({
      where: { active: true, organizationId: orgId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Vazifalar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Jami {tasks.length} ta vazifa</p>
        </div>
        <AddTaskButton users={users} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Chip label="Barchasi" href="/tasks" active={!statusFilter} />
        {TASK_STATUSES.map((s) => (
          <Chip
            key={s}
            label={TASK_STATUS_LABEL[s]}
            href={`/tasks?status=${s}`}
            active={statusFilter === s}
          />
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Vazifa</th>
              <th className="px-4 py-3 font-medium">Prioritet</th>
              <th className="px-4 py-3 font-medium">Muddat</th>
              <th className="px-4 py-3 font-medium">Mas&apos;ul</th>
              <th className="px-4 py-3 font-medium">Holat</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  Vazifa topilmadi.
                </td>
              </tr>
            )}
            {tasks.map((t) => {
              const overdue =
                t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < now;
              return (
                <tr
                  key={t.id}
                  className="border-b border-border/60 transition last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.title}</div>
                    {t.description && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {t.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${PRIORITY_CLASS[t.priority]}`}
                    >
                      {PRIORITY_LABEL[t.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={overdue ? "text-destructive" : "text-muted-foreground"}>
                      {formatDate(t.dueDate)}
                      {overdue && " ⚠"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.assignedTo?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <TaskStatusSelect taskId={t.id} status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteTaskButton taskId={t.id} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Chip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-primary/40 bg-primary/15 text-foreground"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
