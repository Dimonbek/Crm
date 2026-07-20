import type { Priority, TaskStatus } from "@/generated/prisma/enums";

export const TASK_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
export const PRIORITIES: Priority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  TODO: "Bajarilmagan",
  IN_PROGRESS: "Jarayonda",
  DONE: "Bajarilgan",
};

export const TASK_STATUS_CLASS: Record<TaskStatus, string> = {
  TODO: "bg-muted text-muted-foreground border-border",
  IN_PROGRESS: "bg-warning/15 text-warning border-warning/30",
  DONE: "bg-success/15 text-success border-success/30",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: "Past",
  MEDIUM: "O'rta",
  HIGH: "Yuqori",
  URGENT: "Shoshilinch",
};

export const PRIORITY_CLASS: Record<Priority, string> = {
  LOW: "bg-muted text-muted-foreground border-border",
  MEDIUM: "bg-primary/15 text-primary border-primary/30",
  HIGH: "bg-warning/15 text-warning border-warning/30",
  URGENT: "bg-destructive/15 text-destructive border-destructive/30",
};
