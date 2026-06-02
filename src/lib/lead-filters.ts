import { LeadSource, LeadStatus, Prisma } from "@prisma/client";

export const LEADS_PER_PAGE = 15;

/** Columns needed for the leads table — omits heavy/unused fields like updatedAt */
export const leadListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  company: true,
  position: true,
  source: true,
  status: true,
  message: true,
  assignedUser: {
    select: { id: true, name: true },
  },
  isActive: true,
  createdAt: true,
} as const satisfies Prisma.LeadSelect;

export type LeadListItem = Prisma.LeadGetPayload<{
  select: typeof leadListSelect;
}>;

const textSearchFields = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "company",
  "position",
] as const;

export function parsePage(value: string | null): number {
  const n = parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export function formatEnumLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatAssignedManager(lead: LeadListItem): string {
  return lead.assignedUser?.name ?? "—";
}

function enumValuesMatchingSearch<T extends string>(
  values: readonly T[],
  term: string,
): T[] {
  const lower = term.toLowerCase();
  return values.filter(
    (value) =>
      value.toLowerCase().includes(lower) ||
      formatEnumLabel(value).toLowerCase().includes(lower),
  );
}

export function buildLeadWhere(params: {
  search?: string;
  source?: LeadSource;
  status?: LeadStatus;
  /** When set, only leads assigned to this manager user id. */
  assignedUserId?: string;
}): Prisma.LeadWhereInput {
  const conditions: Prisma.LeadWhereInput[] = [];

  if (params.assignedUserId?.trim()) {
    conditions.push({ assignedUserId: params.assignedUserId.trim() });
  }

  if (params.source) {
    conditions.push({ source: params.source });
  }

  if (params.status) {
    conditions.push({ status: params.status });
  }

  const term = params.search?.trim();
  if (term) {
    const matchedSources = enumValuesMatchingSearch(
      Object.values(LeadSource),
      term,
    );
    const matchedStatuses = enumValuesMatchingSearch(
      Object.values(LeadStatus),
      term,
    );

    const textConditions = textSearchFields.map((field) => ({
      [field]: { contains: term, mode: "insensitive" as const },
    }));

    conditions.push({
      OR: [
        ...textConditions,
        {
          assignedUser: {
            name: { contains: term, mode: "insensitive" },
          },
        },
        ...(matchedSources.length > 0
          ? [{ source: { in: matchedSources } }]
          : []),
        ...(matchedStatuses.length > 0
          ? [{ status: { in: matchedStatuses } }]
          : []),
      ],
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export function parseLeadSource(value: string | null): LeadSource | undefined {
  if (!value) return undefined;
  return Object.values(LeadSource).includes(value as LeadSource)
    ? (value as LeadSource)
    : undefined;
}

export function parseLeadStatus(value: string | null): LeadStatus | undefined {
  if (!value) return undefined;
  return Object.values(LeadStatus).includes(value as LeadStatus)
    ? (value as LeadStatus)
    : undefined;
}
