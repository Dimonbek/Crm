import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@revator.uz").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const orgName = process.env.ADMIN_ORG || "Revator";
  const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Birinchi kompaniya (platformaning 1-mijozi)
  let org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
        webhookToken: process.env.WEBHOOK_SECRET || randomBytes(24).toString("hex"),
      },
    });
    console.log(`✅ Kompaniya yaratildi: ${org.name}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Eski hisob kompaniyasiz qolgan bo'lsa — biriktiramiz
    if (!existing.organizationId) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { organizationId: org.id },
      });
      console.log(`✅ Foydalanuvchi kompaniyaga biriktirildi: ${email}`);
    }
  } else {
    await prisma.user.create({
      data: {
        name: "Admin",
        email,
        password: await bcrypt.hash(password, 10),
        role: "ADMIN",
        organizationId: org.id,
      },
    });
    console.log(`✅ Admin yaratildi: ${email} (${org.name})`);
  }

  await backfill(org.id);
}

/**
 * Multi-tenant'ga o'tishдан oldingi eski ma'lumotlar `organizationId`siz qolgan.
 * Ularni birinchi kompaniyaga biriktiramiz — aks holda ular ko'rinmay qoladi.
 * Idempotent: egasi bor yozuvlarga tegmaydi.
 */
async function backfill(orgId: string) {
  const where = { organizationId: null };
  const [u, c, l, d, t, n, a] = await Promise.all([
    prisma.user.updateMany({ where, data: { organizationId: orgId } }),
    prisma.contact.updateMany({ where, data: { organizationId: orgId } }),
    prisma.lead.updateMany({ where, data: { organizationId: orgId } }),
    prisma.deal.updateMany({ where, data: { organizationId: orgId } }),
    prisma.task.updateMany({ where, data: { organizationId: orgId } }),
    prisma.note.updateMany({ where, data: { organizationId: orgId } }),
    prisma.activity.updateMany({ where, data: { organizationId: orgId } }),
  ]);
  const total = u.count + c.count + l.count + d.count + t.count + n.count + a.count;
  if (total > 0) {
    console.log(
      `✅ Eski ma'lumotlar ko'chirildi: ${l.count} lead, ${c.count} kontakt, ` +
        `${d.count} bitim, ${t.count} vazifa, ${u.count} xodim`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
