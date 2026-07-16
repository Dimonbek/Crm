import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@revator.uz";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Foydalanuvchi allaqachon mavjud: ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      name: "Admin",
      email,
      password: await bcrypt.hash(password, 10),
      role: "ADMIN",
    },
  });

  console.log("✅ Admin foydalanuvchi yaratildi:");
  console.log(`   Email:  ${email}`);
  console.log(`   Parol:  ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
