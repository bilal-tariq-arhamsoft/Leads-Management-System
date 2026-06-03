import { prisma } from "@/app/lib/prisma";
import {
  buildLeadWhere,
  LEADS_PER_PAGE,
  leadListSelect,
  parseLeadSource,
  parsePage,
} from "@/lib/lead-filters";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") ?? searchParams.get("search") ?? "";
  const source = parseLeadSource(searchParams.get("source"));

  const where = buildLeadWhere({ search, source });
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
