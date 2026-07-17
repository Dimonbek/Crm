import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentOrg } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { CopyField } from "./settings-client";

export default async function SettingsPage() {
  const { orgId, session } = await currentOrg();

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
  });
  if (!org) notFound();

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const webhookUrl = `${proto}://${host}/api/webhook`;

  const isAdmin = session.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Sozlamalar</h1>
        <p className="mt-1 text-sm text-muted">
          Kompaniya va bot ulanishi
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-medium">Kompaniya</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted">Nomi</div>
            <div className="mt-1 text-sm">{org.name}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Manzil (slug)</div>
            <div className="mt-1 font-mono text-sm">{org.slug}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Yaratilgan</div>
            <div className="mt-1 text-sm">{formatDate(org.createdAt)}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Tarif</div>
            <div className="mt-1 text-sm">
              <span className="rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-xs text-success">
                Bepul
              </span>
            </div>
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-medium">Telegram botni ulash</h2>
          <p className="mt-1 text-sm text-muted">
            Botingizga quyidagi 2 ta sozlamani qo&apos;shing — leadlar avtomatik
            shu yerga tushadi.
          </p>

          <div className="mt-5 flex flex-col gap-4">
            <CopyField label="CRM_WEBHOOK_URL" value={webhookUrl} />
            <CopyField
              label="CRM_WEBHOOK_SECRET (maxfiy — hech kimga bermang)"
              value={org.webhookToken}
              secret
            />
          </div>

          <div className="mt-6 rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-sm font-medium">Qanday ishlaydi</div>
            <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted">
              <li>Botingiz so&apos;rovnomani to&apos;ldirib bo&apos;lgach, shu manzilga ma&apos;lumot yuboradi</li>
              <li>
                So&apos;rovda <code className="text-fg">x-webhook-secret</code>{" "}
                sarlavhasida yuqoridagi maxfiy kalit bo&apos;lishi kerak
              </li>
              <li>Lead avtomatik <b className="text-fg">Leadlar</b> bo&apos;limida paydo bo&apos;ladi</li>
            </ol>
            <p className="mt-3 text-xs text-muted">
              Bu kalit faqat sizning kompaniyangizga tegishli — boshqa
              kompaniyalar sizning leadlaringizni ko&apos;ra olmaydi.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          Bot ulanish sozlamalarini faqat administrator ko&apos;ra oladi.
        </div>
      )}
    </div>
  );
}
