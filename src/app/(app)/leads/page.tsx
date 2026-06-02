import { UserPosition } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import LeadsFilters from "@/components/LeadsFilters";
import { getAdminFromSession } from "@/lib/admin-session";
import { buildLeadWhere, LEADS_PER_PAGE, leadListSelect } from "@/lib/lead-filters";
import { managerAssignedUserIdFilter } from "@/lib/role-access";

export default async function LeadsPage() {
  const user = await getAdminFromSession();
  const isManager = user?.position === UserPosition.MANAGER;
  const assignedUserId =
    isManager && user ? managerAssignedUserIdFilter(user.id) : undefined;

  const where = buildLeadWhere({ assignedUserId });
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      take: LEADS_PER_PAGE,
      orderBy: { createdAt: "desc" },
      select: leadListSelect,
    }),
    prisma.lead.count({ where }),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">Leads</h1>
      <p className="mb-6 text-sm text-neutral-600">
        {isManager
          ? "Leads assigned to you."
          : "All approved leads in the system."}
      </p>
      <LeadsFilters
        initialLeads={leads}
        initialTotal={total}
        apiPath="/api/admin/leads"
        canManage={user?.position === UserPosition.ADMIN}
      />
    </div>
  );
}
