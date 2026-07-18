"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Pencil,
  Trash2,
  UserCheck,
} from "lucide-react";

import { deleteLead } from "@/lib/leads";
import AssignAgentModal from "./AssignAgentModal";

interface Lead {
  id: number;
  lead_id: string;
  customer_name: string;
  assigned_agent: string | null;

  // 👇 Add this
  agent?: {
    id: string;
    employee_id: string;
    full_name: string;
    username: string;
  } | null;

  mobile: string;
  fuel_type: string | null;
  current_retailer: string;
  status: string | null;
  created_by: string | null;
  created_at: string | null;
}

interface Props {
  leads: Lead[];
}

function StatusBadge({
  status,
}: {
  status: string | null;
}) {
  switch (status) {
    case "New":
      return (
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          New
        </span>
      );

    case "Attempt 1":
      return (
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          Attempt 1
        </span>
      );

    case "Attempt 2":
      return (
        <span className="rounded-full bg-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-800">
          Attempt 2
        </span>
      );

    case "Callback":
      return (
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          Callback
        </span>
      );

    case "Interested":
      return (
        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
          Interested
        </span>
      );

    case "Documents Pending":
      return (
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
          Documents Pending
        </span>
      );

    case "Verification":
      return (
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          Verification
        </span>
      );

    case "Sale":
      return (
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Sale
        </span>
      );

    case "No Answer":
      return (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          No Answer
        </span>
      );

    case "Wrong Number":
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          Wrong Number
        </span>
      );

    case "DNCR":
      return (
        <span className="rounded-full bg-red-200 px-3 py-1 text-xs font-semibold text-red-800">
          DNCR
        </span>
      );

    case "Rejected":
      return (
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          Rejected
        </span>
      );

    case "Lost":
      return (
        <span className="rounded-full bg-gray-300 px-3 py-1 text-xs font-semibold text-gray-800">
          Lost
        </span>
      );

    case "Duplicate":
      return (
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
          Duplicate
        </span>
      );

    default:
      return (
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          {status || "New"}
        </span>
      );
  }
}
export default function LeadTable({ leads }: Props) {
  const router = useRouter();

  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmed) return;

    try {
      await deleteLead(id);

      alert("Lead deleted successfully.");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to delete lead.");
    }
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-white shadow">

        <table className="min-w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-5 py-4 text-left">Lead ID</th>
              <th className="px-5 py-4 text-left">Customer</th>
              <th className="px-5 py-4 text-left">Assigned Agent</th>
              <th className="px-5 py-4 text-left">Mobile</th>
              <th className="px-5 py-4 text-left">Fuel</th>
              <th className="px-5 py-4 text-left">Retailer</th>
              <th className="px-5 py-4 text-center">Status</th>
              <th className="px-5 py-4 text-center">Created By</th>
              <th className="px-5 py-4 text-center">Created</th>
              <th className="px-5 py-4 text-center">Actions</th>

            </tr>

          </thead>

          <tbody>

            {leads.map((lead) => (

              <tr
                key={lead.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-5 py-4 font-medium">
                  {lead.lead_id}
                </td>

                <td className="px-5 py-4">
                  {lead.customer_name}
                </td>

                <td className="px-5 py-4">
                  {lead.agent
  ? `${lead.agent.employee_id} • ${lead.agent.full_name}`
  : "Unassigned"}
                </td>

                <td className="px-5 py-4">
                  {lead.mobile}
                </td>

                <td className="px-5 py-4">
                  {lead.fuel_type || "-"}
                </td>

                <td className="px-5 py-4">
                  {lead.current_retailer}
                </td>

                <td className="px-5 py-4 text-center">
                  <StatusBadge status={lead.status} />
                </td>

                <td className="px-5 py-4 text-center">
                  {lead.created_by || "-"}
                </td>

                <td className="px-5 py-4 text-center">
                  {lead.created_at
                    ? new Intl.DateTimeFormat("en-AU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(lead.created_at))
                    : "-"}
                </td>

                <td className="px-5 py-4">

                  <div className="flex justify-center gap-2">

                    <Link
                      href={`/leads/${lead.id}`}
                      className="rounded-md bg-green-600 p-2 text-white hover:bg-green-700"
                      title="View Lead"
                    >
                      <Eye size={16} />
                    </Link>

                    <Link
                      href={`/leads/${lead.id}/edit`}
                      className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700"
                      title="Edit Lead"
                    >
                      <Pencil size={16} />
                    </Link>

                    <button
                      onClick={() => {
                        setSelectedLead(lead.id);
                        setAssignOpen(true);
                      }}
                      className="rounded-md bg-purple-600 p-2 text-white hover:bg-purple-700"
                      title="Assign Lead"
                    >
                      <UserCheck size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(lead.id)}
                      className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700"
                      title="Delete Lead"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <AssignAgentModal
        leadId={selectedLead ?? 0}
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => router.refresh()}
      />
    </>
  );
}