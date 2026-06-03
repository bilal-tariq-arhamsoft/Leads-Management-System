import { UserPosition } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import LeadFormReviewTable, {
  type LeadFormRow,
} from "@/components/LeadFormReviewTable";
import { getAdminFromSession } from "@/lib/admin-session";
import { getManagerAssigneeOptions } from "@/lib/assignees";

export default async function LeadPermissionPage() {
  const user = await getAdminFromSession();
  if (!user || user.position !== UserPosition.ADMIN) {
    redirect("/dashboard");
  }
  const leadForms = await prisma.leadForm.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      company: true,
      position: true,
      source: true,
      message: true,
      createdAt: true,
    },
  });

  const rows: LeadFormRow[] = leadForms.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
  }));

  const assigneeOptions = await getManagerAssigneeOptions();

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
        Lead Permission
      </h1>
      <p className="mb-6 text-sm text-neutral-600">
        Review pending submissions. Assign each lead to a manager, set whether it
        is active, then approve (✓) or reject (✕).
      </p>
      <LeadFormReviewTable rows={rows} assigneeOptions={assigneeOptions} />
    </div>
  );
}
