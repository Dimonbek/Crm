import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LandingPage() {
  // Kirgan foydalanuvchi to'g'ridan-to'g'ri CRM ga tushadi
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-full">
      <Nav />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <WhyUs />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            D
          </div>
          <span className="font-semibold">DimoCRM</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Kirish
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs transition-all hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            Bepul boshlash
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:py-24">
      <div className="relative mx-auto max-w-3xl text-center">
        <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-5xl">
          Botingiz mijoz topadi.
          <br />
          <span className="text-primary">CRM</span> ularni sotuvga aylantiradi.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Leadlaringiz tartibsiz Telegram guruhida yo&apos;qolmasin. Mijoz botda
          so&apos;rovnomani to&apos;ldiradi — ma&apos;lumot avtomatik CRM&apos;ga
          tushadi.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="w-full rounded-xl bg-primary px-6 py-3.5 text-center font-medium text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
          >
            Bepul boshlash →
          </Link>
          <Link
            href="/login"
            className="w-full rounded-xl border border-border px-6 py-3.5 text-center font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground sm:w-auto"
          >
            Hisobim bor
          </Link>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const pains = [
    "Leadlar guruhda boshqa xabarlar orasida yo'qoladi",
    "Kim qo'ng'iroq qilgani, kim qilmagani noma'lum",
    "Mijoz unutiladi — sotuv raqobatchiga ketadi",
    "Qaysi reklama ishlaganini hech kim bilmaydi",
  ];
  return (
    <section className="px-4 py-14">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">
          Tanish holatmi?
        </h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {pains.map((p) => (
            <div
              key={p}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
            >
              <span className="mt-0.5 text-destructive">✕</span>
              <span className="text-sm text-muted-foreground">{p}</span>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-base text-muted-foreground">
          Muammo botда emas — <b className="text-foreground">leadlar bilan ishlash tizimi yo&apos;qligida.</b>
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "1",
      title: "Mijoz botda so'rov qoldiradi",
      desc: "Bot telefon, yo'nalish, sana, odam sonini so'rab oladi — 24/7, avtomatik.",
    },
    {
      n: "2",
      title: "Lead avtomatik CRM'ga tushadi",
      desc: "Hech kim qo'lda ko'chirmaydi. Mijoz tarixi bilan birga saqlanadi.",
    },
    {
      n: "3",
      title: "Menejer ishlaydi, siz nazorat qilasiz",
      desc: "Kim nima qilgani, qaysi bitim qaysi bosqichda — hammasi ko'rinib turadi.",
    },
  ];
  return (
    <section className="border-y border-border/60 bg-muted/70 px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">
          Qanday ishlaydi
        </h2>
        <p className="mt-3 text-center text-muted-foreground">Uch qadam — tamom</p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 font-semibold text-primary">
                {s.n}
              </div>
              <h3 className="mt-4 font-medium">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: "◎", title: "Leadlar", desc: "Avtomatik tushadi, filtr va qidiruv bilan" },
    { icon: "▤", title: "Bitimlar (Kanban)", desc: "Kartani surib bosqichni o'zgartirasiz" },
    { icon: "✓", title: "Vazifalar", desc: "Muddat, prioritet, xodimga tayinlash" },
    { icon: "☰", title: "Kontaktlar", desc: "Har mijozning to'liq tarixi" },
    { icon: "◆", title: "Xodimlar", desc: "Rollar va leadlarni taqsimlash" },
    { icon: "◧", title: "Statistika", desc: "Kunlik holat va sotuv summasi" },
  ];
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">
          Ichida nima bor
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40"
            >
              <div className="text-xl text-primary">{f.icon}</div>
              <h3 className="mt-3 font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const rows = [
    { label: "Telegram bot bilan tayyor integratsiya", us: true, them: false },
    { label: "To'liq o'zbek tilida", us: true, them: false },
    { label: "Bepul boshlanadi, karta kerak emas", us: true, them: false },
    { label: "Bir necha daqiqada ulanadi", us: true, them: false },
  ];
  return (
    <section className="border-y border-border/60 bg-muted/70 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-2xl font-semibold sm:text-3xl">
          Nega boshqa CRM emas?
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          Chet el CRM&apos;lari kuchli — lekin Telegram botingizni tanimaydi.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">
            <div></div>
            <div className="w-20 text-center font-medium text-foreground">Biz</div>
            <div className="w-20 text-center">Boshqalar</div>
          </div>
          {rows.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-border/60 px-4 py-3.5 last:border-0"
            >
              <div className="text-sm">{r.label}</div>
              <div className="w-20 text-center text-success">✓</div>
              <div className="w-20 text-center text-muted-foreground">—</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance text-2xl font-semibold sm:text-3xl">
          Bugungi leadlaringiz qayerda?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Ularni tartibga soling — biznesingizni ulang va bugundan boshlab har
          bir mijozni kuzatib boring.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-block w-full rounded-xl bg-primary px-8 py-4 font-medium text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
        >
          Bepul boshlash →
        </Link>
        <p className="mt-4 text-xs text-muted-foreground">
          Karta kerak emas · Istalgan vaqtda to&apos;xtatasiz
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
            D
          </div>
          <span>DimoCRM</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="transition hover:text-foreground">
            Kirish
          </Link>
          <Link href="/register" className="transition hover:text-foreground">
            Ro&apos;yxatdan o&apos;tish
          </Link>
        </div>
        <span className="text-xs">© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
