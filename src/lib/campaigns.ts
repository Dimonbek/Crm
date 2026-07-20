/** Telegram deep-link payload uchun xavfsiz kod: faqat a-z0-9_ */
export function normalizeCode(input: string): string {
  return input
    .toLowerCase()
    .replace(/['`’]/g, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export type CampaignMetrics = {
  leads: number;
  /** 1 lead narxi = byudjet / leadlar */
  cpl: number | null;
  /** Yutilgan bitimlar soni */
  sales: number;
  /** Yutilgan bitimlar summasi */
  revenue: number;
  /** 1 mijoz narxi = byudjet / sotuvlar */
  cac: number | null;
  /** Daromad − byudjet */
  profit: number;
  /** Foyda foizda: (daromad − byudjet) / byudjet × 100 */
  roi: number | null;
  /** Leaddan sotuvga aylanish foizi */
  conversion: number | null;
};

export function computeMetrics(
  budget: number,
  leads: number,
  sales: number,
  revenue: number
): CampaignMetrics {
  return {
    leads,
    cpl: leads > 0 && budget > 0 ? budget / leads : null,
    sales,
    revenue,
    cac: sales > 0 && budget > 0 ? budget / sales : null,
    profit: revenue - budget,
    roi: budget > 0 ? ((revenue - budget) / budget) * 100 : null,
    conversion: leads > 0 ? (sales / leads) * 100 : null,
  };
}

/** Kampaniya foydali/zararli — qisqa xulosa */
export function verdict(m: CampaignMetrics, budget: number) {
  if (budget === 0) return { label: "Byudjet kiritilmagan", tone: "muted" as const };
  if (m.leads === 0) return { label: "Lead yo'q", tone: "destructive" as const };
  if (m.profit > 0) return { label: "Foyda", tone: "success" as const };
  if (m.sales === 0) return { label: "Sotuv yo'q", tone: "destructive" as const };
  return { label: "Zarar", tone: "destructive" as const };
}

export const TONE_CLASS = {
  success: "bg-success/15 text-success border-success/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

/** Reklama havolasi: t.me/bot?start=kod */
export function deepLink(botUsername: string | null, code: string): string | null {
  if (!botUsername) return null;
  const u = botUsername.replace(/^@/, "").trim();
  if (!u) return null;
  return `https://t.me/${u}?start=${code}`;
}
