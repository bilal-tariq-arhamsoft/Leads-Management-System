import { prisma } from "@/app/lib/prisma";
import { validateManagerAssignment } from "@/lib/assignees";
import { requireAdminOnlyUser } from "@/lib/admin-session";

type ApproveBody = {
  assignedUserId?: string;
  isActive?: boolean;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminOnlyUser();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: ApproveBody = {};
  try {
    body = (await request.json()) as ApproveBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const assignedUserId =
    typeof body.assignedUserId === "string" ? body.assignedUserId.trim() : "";
  const assignment = await validateManagerAssignment(assignedUserId);
  if (!assignment.ok) {
    return Response.json({ error: assignment.error }, { status: 400 });
  }

  const isActive = body.isActive !== false;

  const leadForm = await prisma.leadForm.findUnique({ where: { id } });
  if (!leadForm) {
    return Response.json({ error: "Lead form not found" }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.lead.create({
        data: {
          firstName: leadForm.firstName,
          lastName: leadForm.lastName,
          email: leadForm.email,
          phone: leadForm.phone,
          company: leadForm.company,
          position: leadForm.position,
          source: leadForm.source,
          status: leadForm.status,
          message: leadForm.message,
          assignedUserId: assignment.userId,
          isActive,
        },
      });
      await tx.leadForm.delete({ where: { id } });
    });

    return Response.json({ ok: true });
  } catch (error) {
    let message = "Failed to approve lead";
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      const target = (error as { meta?: { target?: string[] } }).meta?.target;
      if (target?.includes("assignedUserId")) {
        message = "This manager is already assigned to another lead";
      } else if (target?.includes("email")) {
        message = "A lead with this email already exists";
      }
    }
    console.error("POST approve failed:", error);
    return Response.json({ error: message }, { status: 409 });
  }
}
