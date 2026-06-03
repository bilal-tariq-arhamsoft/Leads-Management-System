import { prisma } from "@/app/lib/prisma";
import { requireAdminOnlyUser } from "@/lib/admin-session";
import { HistoryAction, recordHistory } from "@/lib/history";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let actor;
  try {
    actor = await requireAdminOnlyUser();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const leadForm = await prisma.leadForm.findUnique({ where: { id } });
  if (!leadForm) {
    return Response.json({ error: "Lead form not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.leadForm.delete({ where: { id } });
    await recordHistory(
      {
        userId: actor.id,
        action: HistoryAction.LEAD_REJECTED,
        oldData: leadForm,
        newData: null,
      },
      tx,
    );
  });

  return Response.json({ ok: true });
}
