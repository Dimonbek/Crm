import type { Role } from "@/generated/prisma/enums";

export const ROLES: Role[] = ["ADMIN", "MANAGER", "OPERATOR"];

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  MANAGER: "Menejer",
  OPERATOR: "Operator",
};

export const ROLE_CLASS: Record<Role, string> = {
  ADMIN: "bg-danger/15 text-danger border-danger/30",
  MANAGER: "bg-primary/15 text-primary border-primary/30",
  OPERATOR: "bg-surface-2 text-muted border-border",
};
