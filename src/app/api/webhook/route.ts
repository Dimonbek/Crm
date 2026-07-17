import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Bot leadlarni shu endpointga POST qiladi (har kompaniya o'z tokeni bilan).
// Himoya: WEBHOOK_SECRET (header `x-webhook-secret` yoki `?secret=`).

const payloadSchema = z.object({
  phone: z.string().trim().min(3),
  destination: z.string().trim().min(1),
  travelDateText: z.string().trim().optional(),
  travelers: z.coerce.number().int().min(1).optional(),
  childrenText: z.string().trim().optional(),
  contactTime: z.string().trim().optional(),
  telegramUsername: z.string().trim().optional(),
  telegramUserId: z.union([z.string(), z.number()]).optional(),
  managerSuggestion: z.string().trim().optional(),
  telegramMsgId: z.union([z.string(), z.number()]).optional(),
});

export async function POST(req: Request) {
  // Token ham autentifikatsiya, ham qaysi kompaniya ekanini aniqlaydi
  const token =
    req.headers.get("x-webhook-secret") ??
    new URL(req.url).searchParams.get("secret");

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const org = await prisma.organization.findUnique({
    where: { webhookToken: token },
    select: { id: true },
  });

  if (!org) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const d = parsed.data;

  // Kontakt: shu kompaniya ichida telefon bo'yicha dedup
  const contact = await prisma.contact.upsert({
    where: { organizationId_phone: { organizationId: org.id, phone: d.phone } },
    update: {},
    create: {
      phone: d.phone,
      name: d.telegramUsername ? d.telegramUsername.replace(/^@/, "") : null,
      organizationId: org.id,
    },
  });

  const lead = await prisma.lead.create({
    data: {
      phone: d.phone,
      destination: d.destination,
      travelDateText: d.travelDateText || null,
      travelers: d.travelers ?? 1,
      children: d.childrenText || null,
      contactTime: d.contactTime || null,
      source: "telegram",
      telegramMsgId: d.telegramMsgId ? String(d.telegramMsgId) : null,
      contactId: contact.id,
      organizationId: org.id,
    },
  });

  // Telegram tafsilotlarini boy izoh sifatida saqlaymiz
  const details: string[] = [];
  if (d.telegramUsername) details.push(`Username: ${d.telegramUsername}`);
  if (d.telegramUserId) details.push(`Telegram ID: ${d.telegramUserId}`);
  if (d.managerSuggestion) details.push(`Tavsiya menejer: ${d.managerSuggestion}`);

  await prisma.activity.create({
    data: {
      type: "CREATED",
      content: "Lead Telegram botdan qabul qilindi",
      leadId: lead.id,
      organizationId: org.id,
    },
  });

  if (details.length) {
    await prisma.note.create({
      data: {
        content: details.join("\n"),
        authorName: "Telegram bot",
        leadId: lead.id,
        organizationId: org.id,
      },
    });
  }

  return NextResponse.json({ ok: true, leadId: lead.id }, { status: 201 });
}

// Sog'liqni tekshirish (ixtiyoriy)
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "revator-crm webhook" });
}
