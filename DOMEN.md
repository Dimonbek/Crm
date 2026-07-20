# dimocrm.uz — DNS sozlamalari

Railway loyihasi: `hearty-adaptation` / servis `Crm`
Hozirgi ishlaydigan manzil: https://crm-production-b0de.up.railway.app

## Nima uchun Cloudflare kerak

Railway asosiy domen uchun ham CNAME talab qiladi (`@` → railway.app).
Klassik DNS'да domen ildiziga (`@`) CNAME qo'yib bo'lmaydi — ahost.uz ham bermaydi.
Cloudflare "CNAME flattening" qilib bu muammoni hal qiladi (bepul rejaда ham).

## Qadamlar

1. cloudflare.com → Add a site → `dimocrm.uz` → **Free** reja
2. Cloudflare 2 ta nameserver beradi
3. ahost.uz kabinetiда domen NS larini Cloudflare berganiga almashtirish
4. Cloudflare → DNS → quyidagi yozuvlarni qo'shish

## DNS yozuvlari

| Type  | Name                  | Content / Value                                                                       | Proxy      |
|-------|-----------------------|---------------------------------------------------------------------------------------|------------|
| CNAME | `@`                   | `67ftjday.up.railway.app`                                                              | DNS only   |
| TXT   | `_railway-verify`     | `railway-verify=5539885c50f03bc4422e1111579921620b72520703fee18d7a07cbb961462973`      | —          |
| CNAME | `www`                 | `ms5pk2a6.up.railway.app`                                                              | DNS only   |
| TXT   | `_railway-verify.www` | `railway-verify=698b83c4f862df8451af300086fed012177e3cec698315d0a0a858177ba4979f`      | —          |

**Muhim:** CNAME yozuvlarida bulutcha **kulrang (DNS only)** bo'lsin — Railway SSL
sertifikat olguncha. Keyin xohlasangiz yoqish mumkin (Cloudflare SSL rejimi: Full).

## Tekshirish

```bash
railway domain status 164034c4-6cb4-4070-986f-12f232ffc2b8   # dimocrm.uz
railway domain list
```

DNS tarqalishi odatda 15 daqiqa – 2 soat (ba'zan 24 soatgacha).

## Domen ishlagach

- Eski `crm-production-b0de.up.railway.app` manzili ham ishlashда davom etadi
- Botlardagi `CRM_WEBHOOK_URL` ni yangi domenga o'zgartirish SHART EMAS
  (lekin xohlasangiz admin paneldan yangi manzil bilan yangilash mumkin)
