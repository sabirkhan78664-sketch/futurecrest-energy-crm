import { notFound } from "next/navigation";
import { getLead } from "@/lib/leads";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUserProfile } from "@/lib/auth";
import { adminSupabase } from "@/lib/admin";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function MyLeadPage({ params }: Props) {
  const { id } = await params;
  
  // 1. Get current user for security
  const profile = await getCurrentUserProfile();
  if (!profile) {
    notFound();
  }

  // 2. Fetch the lead
  let lead: any = null;

  if (/^\d+$/.test(id)) {
    lead = await getLead(Number(id));
  } else {
    const { data } = await adminSupabase
      .from("leads")
      .select("id")
      .eq("lead_id", decodeURIComponent(id))
      .maybeSingle();
    // Re-load through getLead so assigned agent/closer profiles are enriched
    // consistently whether the URL contains the numeric DB id or Lead ID.
    lead = data?.id ? await getLead(Number(data.id)) : null;
  }

  if (!lead) {
    notFound();
  }

  // Load the real lead history so the progress timeline reflects what
  // actually happened instead of showing a fixed sequence.
  const { data: historyRows } = await adminSupabase
    .from("lead_history")
    .select("id, action, action_by_name, old_value, new_value, notes, created_at")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: true });

  const history = historyRows ?? [];

  // 3. Security: Ensure agents can only view their own assigned leads
  if (profile.role === "Agent") {
    const empId = profile.employee_id || "";
    const userId = profile.id || "";
    
    const f1 = String(lead.agent_id || "");
    const f2 = String(lead.assigned_to || "");
    const f3 = String(lead.assigned_agent || "");
    const f4 = String(lead.agent || "");
    const f5 = String(lead.created_by || "");

    const isAssigned = 
      f1.includes(empId) || f1.includes(userId) ||
      f2.includes(empId) || f2.includes(userId) ||
      f3.includes(empId) || f3.includes(userId) ||
      f4.includes(empId) || f4.includes(userId) ||
      f5.includes(empId) || f5.includes(userId);

    if (!isAssigned) {
      notFound();
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lead Details</h1>
            <p className="text-gray-500">{lead.lead_id || "-"}</p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/my-leads"
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2 text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
              Back to Leads
            </Link>
            <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
              {lead.status}
            </span>
          </div>
        </div>

        {/* Lead Content */}
        {(() => {
          const status = String(lead.status || "Pending").trim();
          const rawApproval = String(lead.approval_status || "").trim();
          const qa = String(lead.qa_status || "Not Required").trim();
          const sold = status.toLowerCase() === "sold";
          const approval = rawApproval || (sold ? "Approved" : status.toLowerCase() === "rejected" ? "Rejected" : "Pending");
          const rejected = status.toLowerCase() === "rejected" || approval.toLowerCase() === "rejected";
          const qaRejected = qa.toLowerCase() === "rejected";
          const assignedAgent = lead.assignedAgent || lead.agent || null;
          const assignedCloser = lead.closer || null;
          const hasAgent = Boolean(lead.assigned_agent || assignedAgent);
          const hasCloser = Boolean(lead.assigned_closer || assignedCloser);
          const assigned = hasAgent || hasCloser || lead.assignment_status === "Assigned";

          const rejectionHistory = history.slice().reverse().find((h: any) =>
            String(h.action || "").toLowerCase().includes("reject") && h.notes
          );
          const qaRejectionHistory = history.slice().reverse().find((h: any) =>
            String(h.action || "").toLowerCase().includes("post-sale qa rejected") && h.notes
          );
          const rejectionReason = lead.rejection_reason || rejectionHistory?.notes;
          const qaRejectionReason = qaRejectionHistory?.notes ||
            (qaRejected ? String(lead.comments || "").split("\n").reverse().find((line: string) => line.toLowerCase().includes("post-sale qa rejected"))?.replace(/^.*?:\s*/, "") : "");

          const duplicateChecked = history.some((h: any) =>
            String(h.action || "").toLowerCase().includes("duplicate")
          );
          const steps = [
            { key: "created", label: "Lead Created", done: true, current: false },
            { key: "duplicate", label: "Duplicate Check", done: duplicateChecked || approval === "Approved" || rejected || sold, current: !duplicateChecked && approval !== "Approved" && !rejected && !sold },
            { key: "approval", label: approval === "Rejected" ? "Approval Rejected" : approval === "Approved" ? "Approval Approved" : "Pending Approval", done: approval === "Approved" || approval === "Rejected", current: approval !== "Approved" && approval !== "Rejected" },
            { key: "assignment", label: hasCloser ? "Closer Assigned" : "Waiting for Assignment", done: hasCloser, current: approval === "Approved" && !hasCloser && !rejected },
            { key: "qa", label: qaRejected ? "QA Rejected" : qa === "Approved" ? "QA Approved" : sold ? "QA Review" : "QA Review", done: qa === "Approved" || qa === "Rejected", current: sold && qa !== "Approved" && qa !== "Rejected" },
            { key: "completed", label: qaRejected || rejected ? "Completed with Rejection" : sold && qa === "Approved" ? "Completed" : "Completed", done: (sold && qa === "Approved") || rejected || qaRejected, current: false },
          ];

          return (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-semibold">Lead Details</h2>
                <div className="space-y-5">
                  <div><p className="text-xs uppercase text-gray-500">Lead ID</p><p className="font-semibold">{lead.lead_id}</p></div>
                  <div><p className="text-xs uppercase text-gray-500">Customer Name</p><p className="font-semibold">{lead.customer_name || "-"}</p></div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Assigned Agent</p>
                    <p className="font-semibold">{assignedAgent?.full_name || "-"}</p>
                    {assignedAgent?.employee_id && <p className="text-xs text-slate-500">{assignedAgent.employee_id}</p>}
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Assigned Closer</p>
                    {assignedCloser ? (
                      <>
                        <p className="font-semibold">{assignedCloser.full_name || "-"}</p>
                        {assignedCloser.employee_id && <p className="text-xs text-slate-500">{assignedCloser.employee_id}</p>}
                      </>
                    ) : (
                      <p className="font-semibold text-amber-700">Waiting for Assignment</p>
                    )}
                  </div>
                  <div><p className="text-xs uppercase text-gray-500">Current Status</p><p className="font-semibold">{status}</p></div>
                  {rejected ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-bold uppercase text-red-700">Rejection Reason</p>
                      <p className="mt-1 text-sm text-red-900">{rejectionReason || "No rejection reason was recorded."}</p>
                    </div>
                  ) : null}
                  {qaRejected ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-bold uppercase text-red-700">QA Rejection Reason</p>
                      <p className="mt-1 text-sm text-red-900">{qaRejectionReason || "No QA rejection reason was recorded."}</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Progress Timeline</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{status}</span>
                </div>
                <div className="mt-5 space-y-4">
                  {steps.map((step) => (
                    <div key={step.key} className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.done ? (step.label.toLowerCase().includes("reject") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700") : step.current ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-400"}`}>
                        {step.done ? (step.label.toLowerCase().includes("reject") ? "×" : "✓") : step.current ? "•" : ""}
                      </span>
                      <div>
                        <p className={`text-sm font-semibold ${step.done ? (step.label.toLowerCase().includes("reject") ? "text-red-700" : "text-slate-800") : step.current ? "text-amber-700" : "text-slate-400"}`}>{step.label}</p>
                        {step.current && <p className="text-xs text-slate-500">Current stage</p>}
                        {step.key === "assignment" && !hasCloser && approval === "Approved" && <p className="text-xs text-amber-600">Closer has not been assigned yet.</p>}
                        {step.key === "qa" && qaRejected && <p className="max-w-sm text-xs text-red-600">Reason: {qaRejectionReason || "No reason recorded."}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {history.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <h3 className="text-sm font-bold text-slate-800">Activity</h3>
                    <div className="mt-3 space-y-3">
                      {history.slice(-5).reverse().map((h: any) => (
                        <div key={h.id} className="rounded-lg bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-800">{h.action}</p>
                          {h.notes && <p className="mt-1 text-xs text-slate-600">{h.notes}</p>}
                          {h.created_at && <p className="mt-1 text-[11px] text-slate-400">{new Date(h.created_at).toLocaleString("en-IN")}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </MainLayout>
  );
}