"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markAllNotificationsReadAction } from "../notification-actions";

export function MarkAllReadButton() {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markAllNotificationsReadAction();
          router.refresh();
        })
      }
    >
      {pending ? "Belgilanmoqda…" : "Hammasini o'qildim"}
    </Button>
  );
}
