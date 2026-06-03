import { prisma } from "@/app/lib/prisma";
import { validateManagerAssignment } from "@/lib/assignees";
import { requireAdminOnlyUser } from "@/lib/admin-session";
import { HistoryAction, recordHistory } from "@/lib/history";
import { leadHistoryInclude } from "@/lib/history-select";

type PatchBody = {
  isActive?: unknown;
  assignedUserId?: unknown;
};

function normalizeIsActive(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") return undefined;
  return value;
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let actor;
  try {
    actor = await requireAdminOnlyUser();
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const leadId = id.trim();
  if (!leadId) {
    return Response.json({ error: "Lead id is required" }, { status: 400 });
  }

  const existingLead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: leadHistoryInclude,
  });
  if (!existingLead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.lead.delete({ where: { id: leadId } });
    await recordHistory(
      {
        userId: actor.id,
        action: HistoryAction.LEAD_DELETED,
        oldData: existingLead,
        newData: null,
      },
      tx,
    );
  });
  return Response.json({ ok: true });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let actor;
  try {
    actor = await requireAdminOnlyUser();
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const leadId = id.trim();
  if (!leadId) {
    return Response.json({ error: "Lead id is required" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const nextIsActive = normalizeIsActive(body.isActive);
  const hasIsActive = nextIsActive !== undefined;

  let assignedUserIdUpdate: string | null | undefined;
  if ("assignedUserId" in body) {
    if (body.assignedUserId === null || body.assignedUserId === "") {
      assignedUserIdUpdate = null;
    } else if (typeof body.assignedUserId === "string") {
      const assignment = await validateManagerAssignment(body.assignedUserId);
      if (!assignment.ok) {
        return Response.json({ error: assignment.error }, { status: 400 });
      }
      assignedUserIdUpdate = assignment.userId;
    } else {
      return Response.json({ error: "Invalid manager assignment" }, { status: 400 });
    }
  }

  if (!hasIsActive && assignedUserIdUpdate === undefined) {
    return Response.json(
      { error: "Provide active and/or manager assignment to update" },
      { status: 400 },
    );
  }

  const existingLead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: leadHistoryInclude,
  });
  if (!existingLead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  try {
    const updatedLead = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.update({
        where: { id: leadId },
        data: {
          ...(hasIsActive ? { isActive: nextIsActive } : {}),
          ...(assignedUserIdUpdate !== undefined
            ? { assignedUserId: assignedUserIdUpdate }
            : {}),
        },
        include: leadHistoryInclude,
      });
      await recordHistory(
        {
          userId: actor.id,
          action: HistoryAction.LEAD_UPDATED,
          oldData: existingLead,
          newData: lead,
        },
        tx,
      );
      return lead;
    });
    return Response.json({
      lead: {
        id: updatedLead.id,
        isActive: updatedLead.isActive,
        assignedUser: updatedLead.assignedUser
          ? { id: updatedLead.assignedUser.id, name: updatedLead.assignedUser.name }
          : null,
      },
    });
  } catch {
    return Response.json({ error: "Could not update lead" }, { status: 400 });
  }
}
