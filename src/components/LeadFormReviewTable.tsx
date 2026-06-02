"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ManagerAssigneeOption } from "@/lib/assignees";

export type LeadFormRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  source: string;
  status: string;
  message: string | null;
  createdAt: string;
};

type RowDraft = {
  assignedUserId: string;
  isActive: boolean;
};

type LeadFormReviewTableProps = {
  rows: LeadFormRow[];
  assigneeOptions: ManagerAssigneeOption[];
};

export default function LeadFormReviewTable({
  rows,
  assigneeOptions,
}: LeadFormReviewTableProps) {
  const router = useRouter();
  const defaultAssigneeId =
    assigneeOptions.find((o) => o.available)?.id ?? "";
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>(() => {
    const initial: Record<string, RowDraft> = {};
    for (const row of rows) {
      initial[row.id] = {
        assignedUserId: defaultAssigneeId,
        isActive: true,
      };
    }
    return initial;
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateDraft(id: string, patch: Partial<RowDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  async function handleApprove(id: string) {
    const draft = drafts[id];
    if (!draft?.assignedUserId) {
      setError("Select an available manager before approving.");
      return;
    }
    const selected = assigneeOptions.find(
      (o) => o.id === draft.assignedUserId,
    );
    if (!selected?.available) {
      setError("Selected manager is already assigned to another lead.");
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/lead-form/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedUserId: draft.assignedUserId,
          isActive: draft.isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Failed to approve lead",
        );
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/lead-form/${id}/reject`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Failed to reject lead",
        );
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  const colSpan = 12;

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {assigneeOptions.length === 0 ? (
        <p className="mb-4 text-sm text-amber-800">
          No managers found. Create a user with position Manager first.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full min-w-[1100px] divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-800">
            <tr>
              <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase text-neutral-100">
                Name
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase text-neutral-100">
                Email
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase text-neutral-100">
                Phone
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase text-neutral-100">
                Company
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase text-neutral-100">
                Source
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase text-neutral-100">
                Status
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase text-neutral-100">
                Submitted
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase text-neutral-100">
                Assign to
              </th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold uppercase text-neutral-100">
                Active
              </th>
              <th className="px-2 py-2.5 text-center text-xs font-semibold uppercase text-neutral-100">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-8 text-center text-neutral-500"
                >
                  No pending form submissions
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const draft = drafts[row.id] ?? {
                  assignedUserId: defaultAssigneeId,
                  isActive: true,
                };
                const busy = busyId === row.id;
                const name = [row.firstName, row.lastName]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr key={row.id} className="hover:bg-neutral-50">
                    <td className="px-2 py-2 text-neutral-900">{name}</td>
                    <td className="px-2 py-2 text-neutral-900">{row.email}</td>
                    <td className="px-2 py-2 text-neutral-600">
                      {row.phone ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-neutral-600">
                      {row.company ?? "—"}
                    </td>
                    <td className="px-2 py-2 text-neutral-600">{row.source}</td>
                    <td className="px-2 py-2 text-neutral-600">{row.status}</td>
                    <td className="px-2 py-2 text-neutral-600">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={draft.assignedUserId}
                        disabled={busy || assigneeOptions.length === 0}
                        onChange={(e) =>
                          updateDraft(row.id, {
                            assignedUserId: e.target.value,
                          })
                        }
                        className="w-full min-w-[140px] rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
                      >
                        <option value="" disabled>
                          Select manager
                        </option>
                        {assigneeOptions.map((manager) => (
                          <option
                            key={manager.id}
                            value={manager.id}
                            disabled={!manager.available}
                          >
                            {manager.name}
                            {manager.available ? "" : " (assigned)"}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={draft.isActive ? "yes" : "no"}
                        disabled={busy}
                        onChange={(e) =>
                          updateDraft(row.id, {
                            isActive: e.target.value === "yes",
                          })
                        }
                        className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm"
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="Approve — save to leads and remove from queue"
                          disabled={busy || !draft.assignedUserId}
                          onClick={() => handleApprove(row.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          title="Reject — remove from queue only"
                          disabled={busy}
                          onClick={() => handleReject(row.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
