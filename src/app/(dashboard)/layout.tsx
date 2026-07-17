import { currentOrg } from "@/lib/auth";
import { Sidebar } from "./sidebar";
import { logoutAction } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session: user } = await currentOrg();
  const initials = (user.name || "?").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-full">
      <Sidebar role={user.role} orgName={user.organizationName} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/60 px-5 backdrop-blur">
          <span className="text-sm text-muted md:hidden">DimoCRM</span>
          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold">
                {initials}
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-sm leading-tight">{user.name}</div>
                <div className="text-xs leading-tight text-muted">
                  {user.role}
                </div>
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:border-danger/50 hover:text-danger"
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
