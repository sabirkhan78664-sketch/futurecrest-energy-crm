import Link from "next/link";
import { Download } from "lucide-react";
import { getMyLeads } from "@/lib/myLeads";
import { adminSupabase } from "@/lib/admin";
import TopAgentPerformance from "./TopAgentPerformance";
import PartnerLinkCard from "./PartnerLinkCard";
import StateClocks from "@/components/dashboard/StateClocks";

function norm(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isRejectedOrLost(lead: any) {
  return [norm(lead.status), norm(lead.approval_status), norm(lead.qa_status)].some(
    (value) => value === "rejected" || value === "lost"
  );
}

function campaignBadgeClass(campaign: string | null) {
  const normalized = norm(campaign);
  if (normalized === "energy") return "bg-blue-100 text-blue-700";
  if (normalized === "phi") return "bg-purple-100 text-purple-700";
  if (normalized === "nbn") return "bg-green-100 text-green-700";
  return "bg-slate-100 text-slate-600";
}

function statusBadgeClass(status: string | null) {
  const normalized = norm(status);
  if (normalized === "sold") return "bg-emerald-100 text-emerald-700";
  if (normalized === "callback") return "bg-blue-100 text-blue-700";
  if (normalized === "lost" || normalized === "rejected") return "bg-red-100 text-red-700";
  if (normalized === "assigned") return "bg-purple-100 text-purple-700";
  return "bg-amber-100 text-amber-700";
}

function formatDDMMYYYY(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function BarRow({
  label,
  count,
  total,
  barClass,
}: {
  label: string;
  count: number;
  total: number;
  barClass: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{count}</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const PERIOD_TABS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

export default async function PartnerDashboard({
  profile,
  period = "today",
}: {
  profile: any;
  period?: string;
}) {
  const leads = await getMyLeads();

  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const now = new Date();
  const todayKey = dateFormatter.format(now);
  const dayKey = (value: string) => dateFormatter.format(new Date(value));

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  function inPeriod(dateStr: string | null) {
    if (period === "all") return true;
    if (!dateStr) return false;

    const date = new Date(dateStr);

    if (period === "today") return dayKey(dateStr) === todayKey;
    if (period === "week") return date >= sevenDaysAgo;

    if (period === "month") {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }

    return true;
  }

  const periodLeads = leads.filter((lead: any) => inPeriod(lead.created_at));

  // Sold/Rejected must be bucketed by closed_at (when the Closer actually
  // recorded the outcome), not created_at — an old lead closed today is
  // still today's outcome, regardless of when it was first submitted.
  const sold = leads.filter(
    (lead: any) => norm(lead.status) === "sold" && inPeriod(lead.closed_at)
  );
  const rejectedLost = leads.filter(
    (lead: any) => isRejectedOrLost(lead) && inPeriod(lead.closed_at || lead.created_at)
  );
  const pending = periodLeads.filter(
    (lead: any) => norm(lead.approval_status) === "pending" || !lead.approval_status
  );
  const assigned = periodLeads.filter(
    (lead: any) =>
      (lead.assigned_agent || lead.assigned_closer) &&
      norm(lead.status) !== "sold" &&
      !isRejectedOrLost(lead)
  );

  const totalInPeriod = periodLeads.length;
  const conversionRate = totalInPeriod > 0 ? (sold.length / totalInPeriod) * 100 : 0;

  // SALES TREND — real Sold counts per weekday, last 7 days, bucketed by
  // closed_at (all-time data, independent of the period tabs).
  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - index));
    const key = dateFormatter.format(d);
    const label = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
    }).format(d);

    const daySold = leads.filter(
      (lead: any) => lead.closed_at && dayKey(lead.closed_at) === key && norm(lead.status) === "sold"
    );

    return { key, label, count: daySold.length };
  });

  const maxTrend = Math.max(1, ...last7Days.map((day) => day.count));

  const recentLeads = [...leads]
    .sort(
      (a: any, b: any) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    .slice(0, 8);

  // leads.assigned_closer has no foreign key constraint to profiles in the
  // database (confirmed directly against the schema), so the closer's name
  // is resolved with a separate lookup, same as the Super Admin dashboard.
  const closerIds = Array.from(
    new Set(
      recentLeads
        .map((lead: { assigned_closer: string | null }) => lead.assigned_closer)
        .filter((id: string | null): id is string => Boolean(id))
    )
  );

  const { data: closerProfiles } = closerIds.length
    ? await adminSupabase
        .from("profiles")
        .select("id, full_name")
        .in("id", closerIds)
    : { data: [] as { id: string; full_name: string | null }[] };

  const closerNameById = new Map(
    (closerProfiles || []).map((profile) => [
      profile.id,
      profile.full_name,
    ])
  );

  // TOP PERFORMANCE — the partner's own field agents, identified by the
  // free-text Agent Name they entered on the submission form (these are
  // not CRM users, so there's no profile/employee_id to join against).
  const agentNameCounts = new Map<string, number>();

  periodLeads.forEach((lead: any) => {
    const name = String(lead.agent_name || "").trim();
    if (!name) return;
    agentNameCounts.set(name, (agentNameCounts.get(name) || 0) + 1);
  });

  const topAgents: { full_name: string; leads: number }[] = [...agentNameCounts.entries()]
    .map(([full_name, leads]) => ({ full_name, leads }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);

  return (
    <div className="space-y-5 pb-8">

      {/* HEADER */}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Home › Agent
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Partner Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back, {profile.full_name || "Partner"}. Here is your channel&apos;s performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {PERIOD_TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={`/agent?period=${tab.key}`}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    period === tab.key
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>

            <Link
              href="/my-leads"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              My Leads
            </Link>

            <a
              href={`/api/leads/export?period=${period}`}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Download size={16} />
              Export
            </a>
          </div>
        </div>
      </div>

      <StateClocks />

      {/* SUBMISSION LINK */}

      {profile.partner_code && <PartnerLinkCard partnerCode={profile.partner_code} />}

      {/* METRIC CARDS */}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leads</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{totalInPeriod}</p>
          <p className="mt-3 text-xs text-slate-500">In selected period</p>
        </div>

        <div className="rounded-xl border border-emerald-500 bg-emerald-600 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-white">Sales</p>
          <p className="mt-2 text-3xl font-bold text-white">{sold.length}</p>
          <p className="mt-3 text-xs text-emerald-100">Marked Sold</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Conversion</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{conversionRate.toFixed(2)}%</p>
          <p className="mt-3 text-xs text-slate-500">Sold ÷ total leads</p>
        </div>
      </div>

      {/* SALES PIPELINE + SALES TREND + TOP PERFORMANCE */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Sales Pipeline</h3>

          <div className="space-y-4">
            <BarRow label="Sold" count={sold.length} total={totalInPeriod} barClass="bg-emerald-500" />
            <BarRow label="Assigned" count={assigned.length} total={totalInPeriod} barClass="bg-blue-500" />
            <BarRow label="Pending" count={pending.length} total={totalInPeriod} barClass="bg-amber-500" />
            <BarRow
              label="Rejected / Lost"
              count={rejectedLost.length}
              total={totalInPeriod}
              barClass="bg-red-500"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-slate-800">Sales trend</h3>

          <div className="mt-5 grid h-32 grid-cols-7 items-end gap-2 border-b border-slate-200 px-1">
            {last7Days.map((day) => (
              <div
                key={day.key}
                className="flex h-full items-end justify-center"
                title={`${day.label}: ${day.count} sold`}
              >
                <div
                  className="w-4 rounded-t bg-emerald-500"
                  style={{ height: day.count ? `${Math.max(8, (day.count / maxTrend) * 100)}%` : "2px" }}
                />
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 text-center text-xs text-slate-400">
            {last7Days.map((day) => (
              <span key={day.key}>{day.label}</span>
            ))}
          </div>
        </div>

        <TopAgentPerformance agents={topAgents} />
      </div>

      {/* RECENT LEADS */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Recent Leads</h3>
          <Link href="/my-leads" className="text-xs font-medium text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Lead ID</th>
                <th className="px-4 py-3">Client ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Offered Retailer</th>
                <th className="px-4 py-3">Closer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {recentLeads.length > 0 ? (
                recentLeads.map((lead: any) => (
                  <tr key={lead.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link
                        href={`/my-leads/${lead.id}`}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        {lead.lead_id || `#${lead.id}`}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-xs">{lead.cl_id || "—"}</td>

                    <td className="px-4 py-3 text-sm">{lead.customer_name || "-"}</td>

                    <td className="px-4 py-3 text-xs text-slate-500">{lead.mobile || "-"}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${campaignBadgeClass(
                          lead.campaign
                        )}`}
                      >
                        {lead.campaign || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs">{lead.offered_retailer || "—"}</td>

                    <td className="px-4 py-3 text-xs">
                      {closerNameById.get(lead.assigned_closer) || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(
                          lead.status
                        )}`}
                      >
                        {lead.status || "Pending"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDDMMYYYY(lead.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No leads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
