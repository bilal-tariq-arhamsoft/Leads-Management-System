import { prisma } from "@/app/lib/prisma";
import { requireAdminOnlyUser } from "@/lib/admin-session";

type PatchBody = {
  isActive?: unknown;
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
  try {
    await requireAdminOnlyUser();
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
    select: { id: true },
  });
  if (!existingLead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  await prisma.lead.delete({ where: { id: leadId } });
  return Response.json({ ok: true });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminOnlyUser();
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

  if (!hasIsActive) {
    return Response.json({ error: "Provide a valid active value to update" }, { status: 400 });
  }

  const existingLead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true },
  });
  if (!existingLead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  try {
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { isActive: nextIsActive },
      select: {
        id: true,
        status: true,
        isActive: true,
        assignedUser: { select: { id: true, name: true } },
      },
    });
    return Response.json({ lead: updatedLead });
  } catch {
    return Response.json({ error: "Could not update lead" }, { status: 400 });
  }
}
