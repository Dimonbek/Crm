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
import {
  AddTaskButton,
  TaskStatusSelect,
  DeleteTaskButton,
} from "./tasks-client";
import { PageHeader, TableCard, FilterChip } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <PageHeader
        title="Vazifalar"
        description={`Jami ${tasks.length} ta vazifa`}
        action={<AddTaskButton users={users} />}
      />

      <div className="flex flex-wrap gap-2">
        <FilterChip label="Barchasi" href="/tasks" active={!statusFilter} />
        {TASK_STATUSES.map((s) => (
          <FilterChip
            key={s}
            label={TASK_STATUS_LABEL[s]}
            href={`/tasks?status=${s}`}
            active={statusFilter === s}
          />
        ))}
      </div>

      <TableCard>
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Vazifa</TableHead>
              <TableHead>Prioritet</TableHead>
              <TableHead>Muddat</TableHead>
              <TableHead>Mas&apos;ul</TableHead>
              <TableHead>Holat</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-32 text-center"
                >
                  Vazifa topilmadi.
                </TableCell>
              </TableRow>
            )}
            {tasks.map((t) => {
              const overdue =
                t.dueDate && t.status !== "DONE" && new Date(t.dueDate) < now;
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="font-medium">{t.title}</div>
                    {t.description && (
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {t.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PRIORITY_CLASS[t.priority]}>
                      {PRIORITY_LABEL[t.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={
                      overdue ? "text-destructive" : "text-muted-foreground"
                    }
                  >
                    {formatDate(t.dueDate)}
                    {overdue && " ⚠"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {t.assignedTo?.name || "—"}
                  </TableCell>
                  <TableCell>
                    <TaskStatusSelect taskId={t.id} status={t.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteTaskButton taskId={t.id} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableCard>
    </div>
  );
}
