import Link from "next/link";
import { currentOrg } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformAdmin } from "@/lib/platform";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { logoutAction } from "./actions";
import { ImpersonationBanner } from "./impersonation-banner";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orgId, session: user } = await currentOrg();
  const initials = (user.name || "?").slice(0, 2).toUpperCase();
  const platformAdmin = isPlatformAdmin(user.email);
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { dealsEnabled: true },
  });
  const dealsEnabled = org?.dealsEnabled ?? true;

  return (
    <div className="flex min-h-full">
      <Sidebar
        role={user.role}
        orgName={user.organizationName}
        dealsEnabled={dealsEnabled}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {user.impersonating && (
          <ImpersonationBanner orgName={user.organizationName} />
        )}
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card/60 px-5 backdrop-blur">
          <MobileNav
            role={user.role}
            orgName={user.organizationName}
            dealsEnabled={dealsEnabled}
          />
          <div className="flex flex-1 items-center justify-end gap-3">
            <ThemeToggle />
            {platformAdmin && (
              <Link
                href="/admin"
                className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm text-primary transition hover:bg-primary/20"
              >
                ◆ Admin panel
              </Link>
            )}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {initials}
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-sm leading-tight">{user.name}</div>
                <div className="text-xs leading-tight text-muted-foreground">
                  {user.role}
                </div>
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-destructive/50 hover:text-destructive"
              >
                Chiqish
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
