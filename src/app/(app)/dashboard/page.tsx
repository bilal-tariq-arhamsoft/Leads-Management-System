import { UserPosition } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { getAdminFromSession } from "@/lib/admin-session";
import { managerAssignedUserIdFilter } from "@/lib/role-access";

export default async function DashboardPage() {
  const user = await getAdminFromSession();
  const isManager = user?.position === UserPosition.MANAGER;

  const leadWhere =
    isManager && user
      ? { assignedUserId: managerAssignedUserIdFilter(user.id) }
      : {};

  const [totalLeads, newLeads] = await Promise.all([
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({
      where: { ...leadWhere, status: "NEW" },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Dashboard</h1>
      <p className="mb-6 text-sm text-neutral-600">
        {isManager
          ? `Welcome, ${user?.name}. Here is an overview of your assigned leads.`
          : "Overview of all leads in the system."}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-600">
            {isManager ? "My leads" : "Total leads"}
          </p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">
            {totalLeads.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-600">New leads</p>
          <p className="mt-1 text-3xl font-semibold text-neutral-900">
            {newLeads.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
