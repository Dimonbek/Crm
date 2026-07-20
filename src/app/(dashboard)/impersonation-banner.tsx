"use client";

import { useState } from "react";
import { stopViewingAction } from "@/app/admin/actions";

/** Platforma egasi boshqa kompaniyani ko'rib turganda chiqadi */
export function ImpersonationBanner({ orgName }: { orgName: string }) {
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning/10 px-5 py-2.5">
      <span className="text-sm text-warning">
        👁 Siz <b>{orgName}</b> kompaniyasini ko&apos;rib turibsiz — bu sizning
        hisobingiz emas
      </span>
      <button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await stopViewingAction();
        }}
        className="rounded-lg border border-warning/40 px-3 py-1.5 text-sm text-warning transition hover:bg-warning/20 disabled:opacity-60"
      >
        {pending ? "..." : "← Admin panelga qaytish"}
      </button>
    </div>
  );
}
