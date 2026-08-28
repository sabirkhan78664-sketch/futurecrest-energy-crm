"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  Eye,
  Trash2,
} from "lucide-react";

import { deleteLead } from "@/lib/leads-client";
import ApproveLeadModal from "./ApproveLeadModal";
import RejectLeadModal from "./RejectLeadModal";

interface Lead {
  id: number;
  lead_id: string;
  customer_name: string;
  assigned_agent: string | null;
  assigned_closer: string | null;
  agent_name?: string | null;

  agent?: {
    id: string;
    employee_id: string;
    full_name: string;
    username: string;
  } | null;

  mobile: string;
  fuel_type: string | null;
  current_retailer: string;
  offered_retailer: string | null;
  status: string | null;
  campaign: string | null;
  created_by: string | null;

  creator?: {
    id: string;
    employee_id: string | null;
    full_name: string | null;
    username: string | null;
  } | null;

  closer?: {
    id: string;
    employee_id: string | null;
    full_name: string | null;
    username: string | null;
  } | null;

  created_at: string | null;
}

interface Props {
  leads: Lead[];
  mode?: "leads" | "pending";
}

/* ============================================================
   STATUS BADGE
============================================================ */

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

/* ============================================================
   CAMPAIGN BADGE
============================================================ */

function CampaignBadge({
  campaign,
}: {
  campaign: string | null;
}) {
  const normalized = String(campaign || "")
    .trim()
    .toLowerCase();

  if (normalized === "energy") {
    return (
      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        Energy
      </span>
    );
  }

  if (normalized === "phi") {
    return (
      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
        PHI
      </span>
    );
  }

  if (normalized === "nbn") {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        NBN
      </span>
    );
  }

  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
      {campaign || "-"}
    </span>
  );
}

/* ============================================================
   LEAD TABLE
============================================================ */

export default function LeadTable({
  leads,
  mode = "leads",
}: Props) {
  const router = useRouter();

  /* ==========================================================
     ROLE
  ========================================================== */

  const [role, setRole] = useState("");
  const [currentUserId, setCurrentUserId] =
    useState("");

  useEffect(() => {
    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setCurrentUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (data) {
        setRole(data.role);
      }
    }

    loadRole();
  }, []);

  /* ==========================================================
     ROLE PERMISSIONS
  ========================================================== */

  const isAgent = role === "Agent";

  const isCloser = role === "Closer";

  const isAdmin =
    role === "Admin" ||
    role === "Super Admin";

  const isQA = role === "QA";

  /*
   * VIEW
   *
   * Closer / Admin / Agent / QA can view.
   */

  const canView =
    isCloser ||
    isAdmin ||
    isAgent ||
    isQA;

  /*
   * EDIT
   *
   * IMPORTANT:
   * Closer MUST NOT have general Edit Lead access.
   *
   * Only Admin / Super Admin.
   */

  const canEdit =
    isAdmin;

  /*
   * ONLY SUPER ADMIN CAN ASSIGN
   */

  /*
   * ONLY ADMIN / SUPER ADMIN CAN DELETE
   */

  const canDelete =
    isAdmin;

  const isPendingPage =
    mode === "pending";

  /* ==========================================================
     MODAL STATE
  ========================================================== */

  const [selectedLead, setSelectedLead] =
    useState<number | null>(null);

  const [approveOpen, setApproveOpen] =
    useState(false);

  const [rejectOpen, setRejectOpen] =
    useState(false);

  /* ==========================================================
     DELETE
  ========================================================== */

  async function handleDelete(
    id: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this lead?"
      );

    if (!confirmed) return;

    try {
      await deleteLead(id);

      alert(
        "Lead deleted successfully."
      );

      router.refresh();
    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete lead."
      );
    }
  }

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>
      <div className="overflow-x-auto rounded-xl border bg-white shadow">

        <table className="min-w-full">

          {/* ==================================================
              HEADER
          ================================================== */}

          <thead className="bg-slate-100">

            <tr>

              <th className="px-5 py-4 text-left">
                Lead ID
              </th>

              <th className="px-5 py-4 text-left">
                Customer
              </th>

              <th className="px-5 py-4 text-left">
                Campaign
              </th>

              {!isAgent && (
                <>
                  <th className="px-5 py-4 text-left">
                    Agent
                  </th>

                  <th className="px-5 py-4 text-left">
                    Mobile
                  </th>

                  <th className="px-5 py-4 text-left">
                    Assigned Closer
                  </th>

                  <th className="px-5 py-4 text-left">
                    Fuel
                  </th>

                  <th className="px-5 py-4 text-left">
                    Current Retailer
                  </th>

                  <th className="px-5 py-4 text-left">
                    Offered Retailer
                  </th>
                </>
              )}

              <th className="px-5 py-4 text-center">
                Status
              </th>

              <th className="px-5 py-4 text-center">
                Created
              </th>

              <th className="px-5 py-4 text-center">
                Actions
              </th>

            </tr>

          </thead>

          {/* ==================================================
              BODY
          ================================================== */}

          <tbody>

            {leads.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="py-12 text-center text-slate-500"
                >
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (

                <tr
                  key={lead.id}
                  className="border-t hover:bg-slate-50"
                >

                  {/* ==========================================
                      LEAD ID
                  ========================================== */}

                  <td className="px-5 py-4 font-medium">

                    {canView ? (
  <Link
    href={
      isAgent
        ? `/my-leads/${lead.id}`
        : `/leads/${lead.id}`
    }
    className="text-blue-600 hover:text-blue-800 hover:underline"
  >
    {lead.lead_id}
  </Link>
) : (
  lead.lead_id
)}

                  </td>

                  {/* ==========================================
                      CUSTOMER
                  ========================================== */}

                  <td className="px-5 py-4">

                    {canView ? (
  <Link
    href={
      isAgent
        ? `/my-leads/${lead.id}`
        : `/leads/${lead.id}`
    }
    className="font-medium text-slate-800 hover:text-blue-600 hover:underline"
  >
    {lead.customer_name}
  </Link>
) : (
  lead.customer_name
)}

                  </td>

                  {/* ==========================================
                      CAMPAIGN
                  ========================================== */}

                  <td className="px-5 py-4">
                    <CampaignBadge
                      campaign={lead.campaign}
                    />
                  </td>

                  {/* ==========================================
                      ASSIGNED AGENT
                  ========================================== */}

                  {!isAgent && (
                    <>
                      <td className="px-5 py-4">

                        {lead.creator ? (
                          <>
                            {lead.creator.employee_id ||
                              lead.creator.username ||
                              "Agent"}
                            {lead.creator.full_name && (
                              <>
                                {" • "}
                                {lead.creator.full_name}
                              </>
                            )}
                          </>
                        ) : lead.agent ? (
                          <>
                            {lead.agent.employee_id}
                            {" • "}
                            {lead.agent.full_name}
                          </>
                        ) : lead.agent_name ? (
                          <>
                            {lead.agent_name}
                            {" "}
                            <span className="text-gray-400 text-xs">
                              (Partner)
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">
                            Unknown
                          </span>
                        )}

                      </td>

                      {/* MOBILE */}

                      <td className="px-5 py-4">
                        {lead.mobile}
                      </td>

                      {/* ASSIGNED CLOSER */}

                      <td className="px-5 py-4">
                        {lead.closer ? (
                          <>
                            {lead.closer.employee_id ||
                              lead.closer.username ||
                              "Closer"}
                            {lead.closer.full_name && (
                              <>
                                {" • "}
                                {lead.closer.full_name}
                              </>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* FUEL */}

                      <td className="px-5 py-4">
                        {lead.fuel_type || "-"}
                      </td>

                      {/* RETAILER */}

                      <td className="px-5 py-4">
                        {lead.current_retailer || "-"}
                      </td>

                      {/* OFFERED RETAILER */}

                      <td className="px-5 py-4">
                        {lead.offered_retailer || "-"}
                      </td>
                    </>
                  )}

                  {/* ==========================================
                      STATUS
                  ========================================== */}

                  <td className="px-5 py-4 text-center">

                    <StatusBadge
                      status={lead.status}
                    />

                  </td>

                  {/* ==========================================
                      CREATED DATE
                  ========================================== */}

                  <td className="px-5 py-4 text-center">

                    {lead.created_at
                      ? new Intl.DateTimeFormat(
                          "en-AU",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            timeZone: "UTC",
                          }
                        ).format(
                          new Date(
                            lead.created_at
                          )
                        )
                      : "-"}

                  </td>

                  {/* ==========================================
                      ACTIONS
                  ========================================== */}

                  {canView && (
                    <td className="px-5 py-4">

                      <div className="flex justify-center gap-2">

                        {/* ==================================
                            AGENT
                        ================================== */}

                        {isAgent && (
                          <Link
                            href={`/my-leads/${lead.id}`}
                            className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            Track
                          </Link>
                        )}

                        {/* ==================================
                            QA / CLOSER / ADMIN
                        ================================== */}

                        {!isAgent && (
                          <>
                            {/* --------------------------------
                                VIEW
                            -------------------------------- */}

                            <Link
                              href={`/leads/${lead.id}`}
                              className="rounded-md bg-green-600 p-2 text-white hover:bg-green-700"
                              title="View Lead"
                            >
                              <Eye size={16} />
                            </Link>

                            {/* --------------------------------
                                EDIT
                                
                                ADMIN / SUPER ADMIN ONLY
                            -------------------------------- */}

                            {canEdit && (
                              <Link
                                href={`/leads/${lead.id}/edit`}
                                className="rounded-md bg-blue-600 p-2 text-white hover:bg-blue-700"
                                title="Edit Lead"
                              >
                                <span className="text-sm font-bold">
                                  Edit
                                </span>
                              </Link>
                            )}

                            {/* =================================
                                PENDING APPROVALS
                            ================================= */}

                            {isPendingPage ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedLead(
                                      lead.id
                                    );

                                    setApproveOpen(
                                      true
                                    );
                                  }}
                                  className="rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
                                  title="Approve Lead"
                                >
                                  Approve
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedLead(
                                      lead.id
                                    );

                                    setRejectOpen(
                                      true
                                    );
                                  }}
                                  className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                                  title="Reject Lead"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <>
                                {/* ==============================
                                    DELETE
                                    
                                    ADMIN / SUPER ADMIN ONLY
                                ============================== */}

                                {canDelete && (
                                  <button
                                    onClick={() =>
                                      handleDelete(
                                        lead.id
                                      )
                                    }
                                    className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700"
                                    title="Delete Lead"
                                  >
                                    <Trash2
                                      size={16}
                                    />
                                  </button>
                                )}
                              </>
                            )}
                          </>
                        )}

                      </div>

                    </td>
                  )}

                </tr>

              ))
            )}

          </tbody>

        </table>

      </div>

      {/* ========================================================
          APPROVE MODAL
      ======================================================== */}

      <ApproveLeadModal
        leadId={
          selectedLead ?? 0
        }
        open={approveOpen}
        currentUserId={
          currentUserId
        }
        onClose={() =>
          setApproveOpen(false)
        }
        onApproved={() =>
          router.refresh()
        }
      />

      {/* ========================================================
          REJECT MODAL
      ======================================================== */}

      <RejectLeadModal
        leadId={
          selectedLead ?? 0
        }
        currentUserId={
          currentUserId
        }
        open={rejectOpen}
        onClose={() =>
          setRejectOpen(false)
        }
        onRejected={() =>
          router.refresh()
        }
      />

    </>
  );
}