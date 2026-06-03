import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

/** Models this app uses — invalidate cached client if any are missing after `prisma generate`. */
const REQUIRED_DELEGATES = ["user", "lead", "leadForm", "history"] as const;

function hasRequiredDelegates(client: PrismaClient): boolean {
  const record = client as unknown as Record<
    string,
    { findUnique?: unknown } | undefined
  >;
  return REQUIRED_DELEGATES.every(
    (name) => typeof record[name]?.findUnique === "function",
  );
}

function getRuntimeModels(client: PrismaClient) {
  return (
    client as unknown as {
      _runtimeDataModel?: {
        models?: Record<string, { fields?: { name: string }[] }>;
      };
    }
  )._runtimeDataModel?.models;
}

/** Detect stale Prisma clients still using removed Lead.assignedTo. */
function leadModelHasAssignedUserId(client: PrismaClient): boolean {
  const leadFields = getRuntimeModels(client)?.Lead?.fields ?? [];
  return leadFields.some((field) => field.name === "assignedUserId");
}

/** One manager must be assignable to many leads (User.assignedLeads[], not assignedLead?). */
function userModelAllowsMultipleAssignedLeads(client: PrismaClient): boolean {
  const userFields = getRuntimeModels(client)?.User?.fields ?? [];
  return userFields.some((field) => field.name === "assignedLeads");
}

function isClientInSync(client: PrismaClient): boolean {
  return (
    hasRequiredDelegates(client) &&
    leadModelHasAssignedUserId(client) &&
    userModelAllowsMultipleAssignedLeads(client)
  );
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  if (cached && !isClientInSync(cached)) {
    void cached.$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
  }

  if (!globalForPrisma.prisma) {
    const client = createPrismaClient();
    if (!isClientInSync(client)) {
      throw new Error(
        'Prisma client is out of date. Run "npx prisma generate" and restart the dev server.',
      );
    }
    globalForPrisma.prisma = client;
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
