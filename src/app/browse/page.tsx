import { prisma } from "@/app/lib/prisma";
import LeadsFilters from "@/components/LeadsFilters";
import { buildLeadWhere, LEADS_PER_PAGE, leadListSelect } from "@/lib/lead-filters";

/** Public browse view (no auth). */
export default async function BrowseLeadsPage() {
  const where = buildLeadWhere({});
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
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-semibold">Browse leads</h1>
      <LeadsFilters initialLeads={leads} initialTotal={total} />
    </div>
  );
}
