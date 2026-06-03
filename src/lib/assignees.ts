import { UserPosition } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";

export type ManagerAssigneeOption = {
  id: string;
  name: string;
};

export async function getManagerAssigneeOptions(): Promise<
  ManagerAssigneeOption[]
> {
  return prisma.user.findMany({
    where: { position: UserPosition.MANAGER },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function validateManagerAssignment(
  assignedUserId: string,
): Promise<
  | { ok: true; userId: string; userName: string }
  | { ok: false; error: string }
> {
  const trimmed = assignedUserId.trim();
  if (!trimmed) {
    return { ok: false, error: "Select a manager to assign" };
  }

  const user = await prisma.user.findUnique({
    where: { id: trimmed },
    select: { id: true, name: true, position: true },
  });

  if (!user || user.position !== UserPosition.MANAGER) {
    return { ok: false, error: "Select a valid manager from the dropdown" };
  }

  return { ok: true, userId: user.id, userName: user.name };
}
