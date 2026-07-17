# DimoCRM

Ko'p kompaniyali (multi-tenant) CRM platformasi — har bir biznes o'z Telegram botini ulaydi.

## Texnologiyalar

- **Next.js 16** (App Router) + **TypeScript**
- **Prisma 7** + **PostgreSQL**
- **Tailwind CSS v4**
- Auth: JWT cookie (`jose`) + `bcryptjs`

## Modullar

Dashboard · Leadlar (+ detal, izohlar, bitimga aylantirish) · Kontaktlar · Bitimlar (Kanban) · Vazifalar · Foydalanuvchilar (rollar) · Bot webhook (`/api/webhook`)

## Lokal ishga tushirish

```bash
npm install
# .env faylini to'ldiring (.env.example dan nusxa oling) — PostgreSQL kerak
npx prisma db push      # jadvallarni yaratadi
npm run seed            # admin foydalanuvchi (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev             # http://localhost:3000
```

Namunaviy ma'lumot uchun: `npm run seed:demo`

## Muhit o'zgaruvchilari (.env)

| O'zgaruvchi | Tavsif |
|-------------|--------|
| `DATABASE_URL` | PostgreSQL ulanish satri |
| `AUTH_SECRET` | Sessiya imzolash kaliti (uzun tasodifiy satr) |
| `WEBHOOK_SECRET` | Bot ↔ CRM webhook maxfiy kaliti |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Birinchi admin (deploy'da avtomatik yaratiladi) |

## Deploy (Railway)

1. GitHub'ga push qiling.
2. Railway'da yangi loyiha → GitHub repo'ni ulang.
3. **PostgreSQL** plugin qo'shing (`DATABASE_URL` avtomatik ulanadi).
4. `AUTH_SECRET`, `WEBHOOK_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` o'zgaruvchilarini qo'shing.
5. Deploy — `railway.json` `prisma db push` + admin seed + `next start` ni bajaradi.

## Bot integratsiyasi

Bot leadlarni `POST /api/webhook` ga yuboradi (header `x-webhook-secret`).
Bot tomonida `CRM_WEBHOOK_URL` va `CRM_WEBHOOK_SECRET` o'rnatilishi kerak.
