import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { isPlatformAdmin, supportContact } from "@/lib/platform";
import { formatDate } from "@/lib/format";

export default async function SettingsPage() {
  const { orgId, session } = await currentOrg();

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) notFound();

  const leadCount = await prisma.lead.count({ where: { organizationId: orgId } });
  const connected = !!org.botUsername || leadCount > 0;
  const support = supportContact();
  const platformAdmin = isPlatformAdmin(session.email);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Sozlamalar</h1>
        <p className="mt-1 text-sm text-muted">Kompaniya va bot ulanishi</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-medium">Kompaniya</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Nomi" value={org.name} />
          <Info label="Tarif" value="Bepul" accent="text-success" />
          <Info label="Yaratilgan" value={formatDate(org.createdAt)} />
          <Info
            label="Telegram bot"
            value={org.botUsername ? `@${org.botUsername}` : "Ulanmagan"}
            accent={org.botUsername ? "text-fg" : "text-warning"}
          />
        </div>
      </div>

      {/* Bot holati */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-medium">Telegram bot</h2>

        {connected ? (
          <div className="mt-4 rounded-lg border border-success/30 bg-success/10 p-4">
            <div className="text-sm text-success">
              ✓ Bot ulangan — leadlar avtomatik CRM&apos;ga tushmoqda
            </div>
            {org.botUsername && (
              <a
                href={`https://t.me/${org.botUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                t.me/{org.botUsername}
              </a>
            )}
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted">
              Botingiz hali ulanmagan. Biz uni siz uchun ulab beramiz — bot
              tokeningizni hech kimga bermang, faqat biz bilan bog&apos;laning.
            </p>
            <a
              href={`https://t.me/${support}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-fg transition hover:bg-primary-hover"
            >
              💬 Bot ulash uchun bog&apos;lanish
            </a>
          </>
        )}

        <div className="mt-6 rounded-lg border border-border bg-surface-2 p-4">
          <div className="text-sm font-medium">Qanday ishlaydi</div>
          <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted">
            <li>Mijoz Telegram botingizda so&apos;rovnomani to&apos;ldiradi</li>
            <li>
              Lead avtomatik <b className="text-fg">Leadlar</b> bo&apos;limida
              paydo bo&apos;ladi
            </li>
            <li>
              Sotilganда lidni ochib <b className="text-fg">💰 Sotildi</b> bosasiz
              va summani yozasiz
            </li>
            <li>
              Mijoz qayta murojaat qilsa —{" "}
              <b className="text-fg">Mijozlar</b> bo&apos;limida butun tarixi
              saqlanadi
            </li>
          </ol>
        </div>
      </div>

      {platformAdmin && (
        <p className="text-sm text-muted">
          Bot ulash kalitlari <b className="text-fg">Admin panel</b>да
          boshqariladi.
        </p>
      )}
    </div>
  );
}

function Info({
  label,
  value,
  accent = "text-fg",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-sm ${accent}`}>{value}</div>
    </div>
  );
}
