"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { TASK_STATUSES } from "@/lib/tasks";
import type { TaskStatus } from "@/generated/prisma/enums";

const createSchema = z.object({
  title: z.string().trim().min(1, "Sarlavha kiriting"),
  description: z.string().trim().optional(),
  dueDate: z.string().trim().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  assignedToId: z.string().trim().optional(),
});

export type CreateTaskState = { error?: string; ok?: boolean };

export async function createTaskAction(
  _prev: CreateTaskState,
  formData: FormData
): Promise<CreateTaskState> {
  const { orgId } = await currentOrg();

  const parsed = createSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority"),
    assignedToId: formData.get("assignedToId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ma'lumot noto'g'ri" };
  }

  const { title, description, dueDate, priority, assignedToId } = parsed.data;

  // Faqat shu kompaniya xodimiga tayinlash mumkin
  const assignee = assignedToId
    ? await prisma.user.findFirst({
        where: { id: assignedToId, organizationId: orgId },
      })
    : null;

  await prisma.task.create({
    data: {
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      assignedToId: assignee?.id ?? null,
      organizationId: orgId,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: true };
}

export async function setTaskStatusAction(
  taskId: string,
  status: string
): Promise<void> {
  const { orgId } = await currentOrg();
  if (!TASK_STATUSES.includes(status as TaskStatus)) return;

  await prisma.task.updateMany({
    where: { id: taskId, organizationId: orgId },
    data: { status: status as TaskStatus },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  const { orgId } = await currentOrg();
  await prisma.task.deleteMany({
    where: { id: taskId, organizationId: orgId },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
}
