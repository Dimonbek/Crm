import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Demo kompaniya
  const org = await prisma.organization.upsert({
    where: { slug: "demo-tour" },
    update: {},
    create: {
      name: "Demo Tour",
      slug: "demo-tour",
      webhookToken: randomBytes(24).toString("hex"),
    },
  });
  const orgId = org.id;

  // Xodimlar
  const pass = await bcrypt.hash("demo123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "demo@demo.uz" },
    update: {},
    create: { name: "Demo Admin", email: "demo@demo.uz", password: pass, role: "ADMIN", organizationId: orgId },
  });
  const dilnoza = await prisma.user.upsert({
    where: { email: "dilnoza@demo.uz" },
    update: {},
    create: { name: "Dilnoza Karimova", email: "dilnoza@demo.uz", password: pass, role: "MANAGER", organizationId: orgId },
  });
  const jasur = await prisma.user.upsert({
    where: { email: "jasur@demo.uz" },
    update: {},
    create: { name: "Jasur Aliyev", email: "jasur@demo.uz", password: pass, role: "OPERATOR", organizationId: orgId },
  });

  // Kontaktlar
  const c1 = await prisma.contact.upsert({
    where: { organizationId_phone: { organizationId: orgId, phone: "+998901112233" } },
    update: {},
    create: { name: "Aziz Rahimov", phone: "+998901112233", email: "aziz@mail.uz", organizationId: orgId },
  });
  const c2 = await prisma.contact.upsert({
    where: { organizationId_phone: { organizationId: orgId, phone: "+998935556677" } },
    update: {},
    create: { name: "Malika Yusupova", phone: "+998935556677", organizationId: orgId },
  });

  // Leadlar
  const leadsData = [
    { phone: "+998901112233", destination: "Turkiya, Antalya", travelers: 4, contactTime: "14:00-18:00", status: "CONTACTED" as const, assignedToId: dilnoza.id, contactId: c1.id },
    { phone: "+998935556677", destination: "BAA, Dubay", travelers: 2, contactTime: "10:00-12:00", status: "QUALIFIED" as const, assignedToId: dilnoza.id, contactId: c2.id },
    { phone: "+998977778899", destination: "Misr, Sharm-el-Sheikh", travelers: 3, status: "NEW" as const },
    { phone: "+998901234567", destination: "Malayziya, Kuala-Lumpur", travelers: 5, status: "NEW" as const, assignedToId: jasur.id },
  ];
  for (const d of leadsData) {
    const lead = await prisma.lead.create({ data: { ...d, source: "manual", organizationId: orgId } });
    await prisma.activity.create({ data: { type: "CREATED", content: "Lead yaratildi", leadId: lead.id, organizationId: orgId } });
  }

  // Bitimlar
  const dealsData = [
    { title: "Antalya oilaviy tur", amount: 12000000, stage: "PROPOSAL" as const, contactId: c1.id, assignedToId: dilnoza.id },
    { title: "Dubay biznes sayohat", amount: 8500000, stage: "NEGOTIATION" as const, contactId: c2.id, assignedToId: dilnoza.id },
    { title: "Sharm-el-Sheikh paket", amount: 15000000, stage: "CLOSED_WON" as const, assignedToId: jasur.id },
  ];
  for (const d of dealsData) {
    const deal = await prisma.deal.create({ data: { ...d, organizationId: orgId } });
    await prisma.activity.create({ data: { type: "CREATED", content: "Bitim yaratildi", dealId: deal.id, organizationId: orgId } });
  }

  // Vazifalar
  const plus = (days: number) => new Date(Date.now() + days * 86400000);
  await prisma.task.createMany({
    data: [
      { title: "Aziz Rahimovga qo'ng'iroq qilish", priority: "HIGH", status: "TODO", dueDate: plus(1), assignedToId: dilnoza.id, organizationId: orgId },
      { title: "Dubay uchun taklif tayyorlash", priority: "URGENT", status: "IN_PROGRESS", dueDate: plus(0), assignedToId: dilnoza.id, organizationId: orgId },
      { title: "Malika bilan shartnoma imzolash", priority: "MEDIUM", status: "TODO", dueDate: plus(3), organizationId: orgId },
    ],
  });

  console.log("✅ Demo kompaniya va ma'lumotlar tayyor");
  console.log(`   Kompaniya: ${org.name}`);
  console.log(`   Login:     demo@demo.uz / demo123`);
  console.log(`   Bot token: ${org.webhookToken}`);
  void owner;
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
