import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";

// Joriy kompaniyaning valyutasi ("UZS" / "USD"). React cache — bitta so'rovda
// bir marta bazaga boradi, xohlagancha chaqirsa bo'ladi.
export const getCurrency = cache(async (): Promise<string> => {
  const { orgId } = await currentOrg();
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { currency: true },
  });
  return org?.currency ?? "UZS";
});
