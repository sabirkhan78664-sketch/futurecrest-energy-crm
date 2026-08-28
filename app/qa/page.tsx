import MainLayout from "@/components/layout/MainLayout";
import LeadsRealtimeRefresher from "@/components/leads/LeadsRealtimeRefresher";
import { adminSupabase } from "@/lib/admin";
import { getCurrentUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Phone, Eye, ClipboardCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function qaLabel(status: string | null) {
  if (status === "Approved") return "Approved";
  if (status === "Rejected") return "Rejected";
  return "Not Audited";
}

function getPeriodStart(period: string): Date | null {
  const now = new Date();

  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
  }

  if (period === "month") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start;
  }

  return null;
}

const PERIOD_LABELS: Record<string, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};

export default async function QAPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; period?: string }>;
}) {
  const profile = await getCurrentUserProfile();
  const { filter, period = "" } = await searchParams;

  if (!profile) redirect("/login");

  if (!["QA", "Admin", "Super Admin"].includes(profile.role)) {
    redirect("/unauthorized");
  }

  // QA has visibility of every lead. RLS is intentionally bypassed here
  // after the authenticated role check above.
  const { data: leads, error } = await adminSupabase
    .from("leads")
    .select(
      "id, lead_id, customer_name, mobile, fuel_type, status, approval_status, qa_status, created_at, closed_at, assigned_agent, assigned_closer"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("QA all-leads error:", error);
  }

  const allLeads = leads || [];
  const periodStart = getPeriodStart(period);

  // Sold-derived buckets are bucketed by closed_at (when the sale/audit
  // outcome was actually recorded) — matches the Dashboard's QA Rejected
  // metric, so the card link lands on a matching count.
  const soldLeads = allLeads.filter(
    (lead: any) =>
      lead.status === "Sold" &&
      (!periodStart || (lead.closed_at && new Date(lead.closed_at) >= periodStart))
  );
  const auditAvailableLeads = soldLeads.filter(
    (lead: any) =>
      lead.qa_status !== "Approved" && lead.qa_status !== "Rejected"
  );

  const filteredLeads =
    filter === "sold"
      ? soldLeads
      : filter === "not-audited"
      ? auditAvailableLeads
      : filter === "approved"
      ? soldLeads.filter((lead: any) => lead.qa_status === "Approved")
      : filter === "rejected"
      ? soldLeads.filter((lead: any) => lead.qa_status === "Rejected")
      : allLeads;
  const pendingAudit = auditAvailableLeads.filter(
    (lead: any) =>
      lead.qa_status !== "Approved" && lead.qa_status !== "Rejected"
  );
  const approved = soldLeads.filter(
    (lead: any) => lead.qa_status === "Approved"
  );
  const rejected = soldLeads.filter(
    (lead: any) => lead.qa_status === "Rejected"
  );

  return (
    <MainLayout>
      <LeadsRealtimeRefresher />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">QA — All Leads</h1>
            <p className="text-slate-500">
              QA can see every lead. Post-Sale QA is available only for Sold leads.
            </p>

            {PERIOD_LABELS[period] && (
              <div className="mt-2 text-sm text-slate-500">
                Sold/audit counts for:
                <span className="ml-2 rounded-md bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                  {PERIOD_LABELS[period]}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 font-medium text-blue-700">
            <ShieldCheck size={20} />
            <span>All Leads: {allLeads.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Sold</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{soldLeads.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">Audit Available</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{pendingAudit.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">QA Approved</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{approved.length}</p>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">QA Rejected</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{rejected.length}</p>
          </div>
        </div>

        {/* SINGLE QA FILTER BAR */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3 shadow-sm">
          {[
            ["all", "All Leads", allLeads.length],
            ["sold", "Sold", soldLeads.length],
            ["not-audited", "Audit Available", pendingAudit.length],
            ["approved", "QA Approved", approved.length],
            ["rejected", "QA Rejected", rejected.length],
          ].map(([key, label, count]) => (
            <Link
              key={key}
              href={`/qa?filter=${key}${period ? `&period=${period}` : ""}`}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                (filter || "all") === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {label} <span className="ml-1 opacity-75">({count})</span>
            </Link>
          ))}
        </div>

        <div className="rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck size={19} className="text-blue-600" />
              <h2 className="font-bold text-slate-900">{filter === "sold" ? "Sold Leads" : filter === "not-audited" ? "Audit Available" : filter === "approved" ? "QA Approved" : filter === "rejected" ? "QA Rejected" : "All Leads"}</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-600">
              <thead className="bg-slate-100 text-slate-900">
                <tr>
                  <th className="px-5 py-3 font-semibold">Lead ID</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Mobile</th>
                  <th className="px-5 py-3 font-semibold">Sales Status</th>
                  <th className="px-5 py-3 font-semibold">QA Audit</th>
                  <th className="px-5 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No leads found.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead: any) => {
                    const isSold = lead.status === "Sold";
                    const auditStatus = qaLabel(lead.qa_status);
                    const auditAvailable =
                      isSold &&
                      auditStatus !== "Approved" &&
                      auditStatus !== "Rejected";

                    return (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {lead.lead_id}
                        </td>
                        <td className="px-5 py-4">{lead.customer_name || "-"}</td>
                        <td className="px-5 py-4">
                          {lead.mobile ? (
                            <a
                              href={`tel:${lead.mobile}`}
                              className="flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              <Phone size={14} /> {lead.mobile}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isSold
                                ? "bg-green-100 text-green-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {lead.status || "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              auditStatus === "Approved"
                                ? "bg-green-100 text-green-800"
                                : auditStatus === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : isSold
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isSold ? auditStatus : "Not Required"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Link
                              href={`/leads/${lead.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <Eye size={15} />
                              View
                            </Link>

                            {auditAvailable && (
                              <Link
                                href={`/leads/${lead.id}`}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700"
                              >
                                <ClipboardCheck size={15} />
                                Audit
                              </Link>
                            )}
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
      </div>
    </MainLayout>
  );
}
