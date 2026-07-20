import { prisma } from "@/lib/prisma";
import { requireAdmin, currentOrg } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { AddUserButton, RoleSelect, ActiveToggle } from "./users-client";

export default async function UsersPage() {
  const me = await requireAdmin();
  const { orgId } = await currentOrg();

  const users = await prisma.user.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { leads: true, deals: true, tasks: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Xodimlar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Jami {users.length} ta xodim</p>
        </div>
        <AddUserButton />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Ism</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Leadlar</th>
              <th className="px-4 py-3 font-medium">Bitimlar</th>
              <th className="px-4 py-3 font-medium">Holat</th>
              <th className="px-4 py-3 font-medium">Qo&apos;shilgan</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === me.userId;
              return (
                <tr
                  key={u.id}
                  className="border-b border-border/60 transition last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium">
                    {u.name}
                    {isSelf && (
                      <span className="ml-2 text-xs text-muted-foreground">(siz)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleSelect userId={u.id} role={u.role} disabled={isSelf} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u._count.leads}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u._count.deals}</td>
                  <td className="px-4 py-3">
                    <ActiveToggle
                      userId={u.id}
                      active={u.active}
                      disabled={isSelf}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
