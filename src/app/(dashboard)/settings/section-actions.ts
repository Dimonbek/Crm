"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";

// "Bitimlar" bo'limini yoqish/o'chirish (faqat ADMIN).
export async function setDealsEnabledAction(enabled: boolean) {
  const { orgId, session } = await currentOrg();
  if (session.role !== "ADMIN") {
    throw new Error("Faqat admin o'zgartira oladi");
  }
  if (session.impersonating) {
    throw new Error("Impersonatsiya rejimida o'zgartirib bo'lmaydi");
  }
  await prisma.organization.update({
    where: { id: orgId },
    data: { dealsEnabled: enabled },
  });
  // Layout (sidebar/menyu) va sozlamalar sahifasini yangilash
  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { ok: true, enabled };
}
