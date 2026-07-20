import type { Role } from "@/generated/prisma/enums";

export const ROLES: Role[] = ["ADMIN", "MANAGER", "OPERATOR"];

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  MANAGER: "Menejer",
  OPERATOR: "Operator",
};

export const ROLE_CLASS: Record<Role, string> = {
  ADMIN: "bg-destructive/15 text-destructive border-destructive/30",
  MANAGER: "bg-primary/15 text-primary border-primary/30",
  OPERATOR: "bg-muted text-muted-foreground border-border",
};
