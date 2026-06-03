"use client";

import { useState } from "react";
import type { ManagerAssigneeOption } from "@/lib/assignees";
import {
  formatAssignedManager,
  type LeadListItem,
} from "@/lib/lead-filters";

const columns = [
  { key: "firstName", label: "First Name", width: "w-[6%]" },
  { key: "lastName", label: "Last Name", width: "w-[6%]" },
  { key: "email", label: "Email", width: "w-[10%]" },
  { key: "phone", label: "Phone", width: "w-[7%]" },
  { key: "company", label: "Company", width: "w-[7%]" },
  { key: "position", label: "Position", width: "w-[7%]" },
  { key: "source", label: "Source", width: "w-[6%]" },
  { key: "message", label: "Message", width: "w-[8%]" },
  { key: "assignedUser", label: "Assigned", width: "w-[7%]" },
  { key: "isActive", label: "Active", width: "w-[5%]" },
] as const;

const ROW_NUM_WIDTH = "w-[4%]";
const ACTIONS_WIDTH = "w-[10%]";

type ColumnKey = (typeof columns)[number]["key"];

function formatCell(key: ColumnKey, lead: LeadListItem): string {
  if (key === "assignedUser") return formatAssignedManager(lead);
  const value = lead[key];
  if (value === null || value === undefined) return "—";
  if (key === "isActive") return value ? "Yes" : "No";
  return String(value);
}

type DisplayCardProps = {
  leads: LeadListItem[];
  page: number;
  pageSize: number;
  emptyMessage?: string;
  canManage?: boolean;
  managerOptions?: ManagerAssigneeOption[];
  onChanged?: () => void;
};

export default function LeadDisplayCard({
  leads,
  page,
  pageSize,
  emptyMessage = "No leads yet",
  canManage = false,
  managerOptions = [],
  onChanged,
}: DisplayCardProps) {
  const [workingLeadId, setWorkingLeadId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [draftIsActive, setDraftIsActive] = useState(true);
  const [draftAssignedUserId, setDraftAssignedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canAssignManager = canManage && managerOptions.length > 0;

  const rowOffset = (page - 1) * pageSize;
  const colSpan = columns.length + 1 + (canManage ? 1 : 0);
  const isBusy = (leadId: string) => workingLeadId === leadId;
  function startEdit(lead: LeadListItem): void {
    setError(null);
    setEditingLeadId(lead.id);
    setDraftIsActive(lead.isActive);
    setDraftAssignedUserId(lead.assignedUser?.id ?? "");
  }

  function cancelEdit(): void {
    setEditingLeadId(null);
    setError(null);
  }

  async function deleteLead(leadId: string): Promise<void> {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;
    setError(null);
    setWorkingLeadId(leadId);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        throw new Error("Failed to delete lead");
      }
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setWorkingLeadId(null);
    }
  }

  async function saveLead(leadId: string): Promise<void> {
    setError(null);
    setWorkingLeadId(leadId);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: draftIsActive,
          ...(canAssignManager ? { assignedUserId: draftAssignedUserId } : {}),
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Failed to update lead");
      }
      setEditingLeadId(null);
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setWorkingLeadId(null);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full table-fixed divide-y divide-neutral-200 text-sm">
        <thead className="bg-neutral-800">
          <tr>
            <th
              className={`overflow-hidden px-2 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-neutral-100 ${ROW_NUM_WIDTH}`}
            >
              #
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`overflow-hidden px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-100 ${col.width}`}
              >
                <span className="block truncate" title={col.label}>
                  {col.label}
                </span>
              </th>
            ))}
            {canManage && (
              <th
                className={`overflow-hidden px-2 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-100 ${ACTIONS_WIDTH}`}
              >
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {leads.length === 0 ? (
            <tr>
              <td
                colSpan={colSpan}
                className="px-4 py-8 text-center text-neutral-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            leads.map((lead, index) => (
              <tr key={lead.id} className="hover:bg-neutral-50">
                <td
                  className={`overflow-hidden px-2 py-2 text-right tabular-nums text-neutral-500 ${ROW_NUM_WIDTH}`}
                >
                  {(rowOffset + index + 1).toLocaleString()}
                </td>
                {columns.map((col) => {
                  const text = formatCell(col.key, lead);
                  if (
                    canManage &&
                    editingLeadId === lead.id &&
                    (col.key === "isActive" || col.key === "assignedUser")
                  ) {
                    if (col.key === "isActive") {
                      return (
                        <td
                          key={col.key}
                          className={`overflow-hidden px-2 py-2 text-neutral-900 ${col.width}`}
                        >
                          <select
                            value={draftIsActive ? "yes" : "no"}
                            onChange={(e) =>
                              setDraftIsActive(e.target.value === "yes")
                            }
                            className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs"
                            disabled={isBusy(lead.id)}
                            aria-label="Active status"
                          >
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </td>
                      );
                    }
                    if (col.key === "assignedUser" && canAssignManager) {
                      return (
                        <td
                          key={col.key}
                          className={`overflow-hidden px-2 py-2 text-neutral-900 ${col.width}`}
                        >
                          <select
                            value={draftAssignedUserId}
                            onChange={(e) =>
                              setDraftAssignedUserId(e.target.value)
                            }
                            className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs"
                            disabled={isBusy(lead.id)}
                            aria-label="Assigned manager"
                          >
                            <option value="" disabled>
                              Select manager
                            </option>
                            {managerOptions.map((manager) => (
                              <option key={manager.id} value={manager.id}>
                                {manager.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      );
                    }
                  }
                  return (
                    <td
                      key={col.key}
                      className={`overflow-hidden px-2 py-2 text-neutral-900 ${col.width}`}
                    >
                      <span className="block truncate" title={text}>
                        {text}
                      </span>
                    </td>
                  );
                })}
                {canManage && (
                  <td className={`overflow-hidden px-2 py-2 ${ACTIONS_WIDTH}`}>
                    {editingLeadId === lead.id ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveLead(lead.id)}
                          disabled={isBusy(lead.id)}
                          className="rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isBusy(lead.id)}
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(lead)}
                          disabled={isBusy(lead.id)}
                          className="rounded-md border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLead(lead.id)}
                          disabled={isBusy(lead.id)}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}
