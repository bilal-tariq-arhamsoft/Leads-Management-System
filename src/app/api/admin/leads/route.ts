import { UserPosition } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { requireSessionUser } from "@/lib/admin-session";
import {
  buildLeadWhere,
  LEADS_PER_PAGE,
  leadListSelect,
  parseLeadSource,
  parseLeadStatus,
  parsePage,
} from "@/lib/lead-filters";
import { managerAssignedUserIdFilter } from "@/lib/role-access";

export async function GET(request: Request) {
  let user;
  try {
    user = await requireSessionUser();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? searchParams.get("search") ?? "";
  const source = parseLeadSource(searchParams.get("source"));
  const status = parseLeadStatus(searchParams.get("status"));

  const assignedUserId =
    user.position === UserPosition.MANAGER
      ? managerAssignedUserIdFilter(user.id)
      : undefined;

  const where = buildLeadWhere({ search, source, status, assignedUserId });
  const requestedPage = parsePage(searchParams.get("page"));
  const pageSize = LEADS_PER_PAGE;
  const skip = (requestedPage - 1) * pageSize;

  const listQuery = {
    where,
    skip,
    take: pageSize,
    orderBy: { createdAt: "desc" as const },
    select: leadListSelect,
  };

  let [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany(listQuery),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);

  if (page !== requestedPage) {
    leads = await prisma.lead.findMany({
      ...listQuery,
      skip: (page - 1) * pageSize,
    });
  }

  return Response.json(
    { leads, total, page, pageSize, totalPages },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
