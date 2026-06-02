import { UserPosition } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";

export type ManagerAssigneeOption = {
  id: string;
  name: string;
  available: boolean;
};

export async function getManagerAssigneeOptions(): Promise<
  ManagerAssigneeOption[]
> {
  const managers = await prisma.user.findMany({
    where: { position: UserPosition.MANAGER },
    select: {
      id: true,
      name: true,
      assignedLead: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  return managers.map((m) => ({
    id: m.id,
    name: m.name,
    available: m.assignedLead === null,
  }));
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
    select: {
      id: true,
      name: true,
      position: true,
      assignedLead: { select: { id: true } },
    },
  });

  if (!user || user.position !== UserPosition.MANAGER) {
    return { ok: false, error: "Select a valid manager from the dropdown" };
  }

  if (user.assignedLead) {
    return {
      ok: false,
      error: `${user.name} is already assigned to another lead`,
    };
  }

  return { ok: true, userId: user.id, userName: user.name };
}
