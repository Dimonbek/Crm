import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Menejerlar
  const pass = await bcrypt.hash("manager123", 10);
  const dilnoza = await prisma.user.upsert({
    where: { email: "dilnoza@revator.uz" },
    update: {},
    create: { name: "Dilnoza Karimova", email: "dilnoza@revator.uz", password: pass, role: "MANAGER" },
  });
  const jasur = await prisma.user.upsert({
    where: { email: "jasur@revator.uz" },
    update: {},
    create: { name: "Jasur Aliyev", email: "jasur@revator.uz", password: pass, role: "OPERATOR" },
  });

  // Kontaktlar
  const c1 = await prisma.contact.upsert({
    where: { phone: "+998901112233" },
    update: {},
    create: { name: "Aziz Rahimov", phone: "+998901112233", email: "aziz@mail.uz" },
  });
  const c2 = await prisma.contact.upsert({
    where: { phone: "+998935556677" },
    update: {},
    create: { name: "Malika Yusupova", phone: "+998935556677" },
  });

  // Leadlar
  const leadsData = [
    { phone: "+998901112233", destination: "Turkiya, Antalya", travelers: 4, contactTime: "14:00-18:00", status: "CONTACTED" as const, assignedToId: dilnoza.id, contactId: c1.id },
    { phone: "+998935556677", destination: "BAA, Dubay", travelers: 2, contactTime: "10:00-12:00", status: "QUALIFIED" as const, assignedToId: dilnoza.id, contactId: c2.id },
    { phone: "+998977778899", destination: "Misr, Sharm-el-Sheikh", travelers: 3, status: "NEW" as const },
    { phone: "+998901234567", destination: "Malayziya, Kuala-Lumpur", travelers: 5, status: "NEW" as const, assignedToId: jasur.id },
    { phone: "+998933334455", destination: "Gruziya, Batumi", travelers: 2, status: "LOST" as const },
  ];
  for (const d of leadsData) {
    const lead = await prisma.lead.create({ data: { ...d, source: "manual" } });
    await prisma.activity.create({ data: { type: "CREATED", content: "Lead yaratildi", leadId: lead.id } });
  }

  // Bitimlar
  const dealsData = [
    { title: "Antalya oilaviy tur", amount: 12000000, stage: "PROPOSAL" as const, contactId: c1.id, assignedToId: dilnoza.id },
    { title: "Dubay biznes sayohat", amount: 8500000, stage: "NEGOTIATION" as const, contactId: c2.id, assignedToId: dilnoza.id },
    { title: "Batumi dam olish", amount: 4000000, stage: "QUALIFICATION" as const },
    { title: "Sharm-el-Sheikh paket", amount: 15000000, stage: "CLOSED_WON" as const, assignedToId: jasur.id },
  ];
  for (const d of dealsData) {
    const deal = await prisma.deal.create({ data: d });
    await prisma.activity.create({ data: { type: "CREATED", content: "Bitim yaratildi", dealId: deal.id } });
  }

  // Vazifalar
  const today = new Date();
  const plus = (days: number) => new Date(today.getTime() + days * 86400000);
  await prisma.task.createMany({
    data: [
      { title: "Aziz Rahimovga qo'ng'iroq qilish", priority: "HIGH", status: "TODO", dueDate: plus(1), assignedToId: dilnoza.id },
      { title: "Dubay uchun taklif tayyorlash", priority: "URGENT", status: "IN_PROGRESS", dueDate: plus(0), assignedToId: dilnoza.id },
      { title: "Malika bilan shartnoma imzolash", priority: "MEDIUM", status: "TODO", dueDate: plus(3) },
      { title: "Eski leadlarni ko'rib chiqish", priority: "LOW", status: "DONE", assignedToId: jasur.id },
    ],
  });

  console.log("✅ Demo ma'lumotlar qo'shildi (menejerlar, kontaktlar, leadlar, bitimlar, vazifalar)");
  console.log("   Menejer login: dilnoza@revator.uz / manager123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
