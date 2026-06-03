import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";

export const HistoryAction = {
  LEAD_DELETED: "deleted",
  LEAD_CREATED: "lead created",
  LEAD_REJECTED: "lead rejected",
  LEAD_UPDATED: "lead updated",
  ADMIN_CREATED: "admin created",
  MANAGER_CREATED: "manager created",
} as const;

type HistoryClient = Pick<PrismaClient, "history">;

export function toHistoryJson(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null || value === undefined) {
    return Prisma.DbNull;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function recordHistory(
  params: {
    userId: string;
    action: string;
    oldData?: unknown;
    newData?: unknown;
  },
  client: HistoryClient = prisma,
): Promise<void> {
  await client.history.create({
    data: {
      userId: params.userId,
      action: params.action,
      oldData: toHistoryJson(params.oldData),
      newData: toHistoryJson(params.newData),
    },
  });
}
