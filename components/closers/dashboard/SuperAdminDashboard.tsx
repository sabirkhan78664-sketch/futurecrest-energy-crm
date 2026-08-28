import { getDashboardMetrics } from "@/lib/dashboardMetrics";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Link from "next/link";

import {
  Users,
  FileText,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  Download,
} from "lucide-react";

/* ============================================================
   BADGE HELPERS
============================================================ */

function campaignBadgeClass(campaign: string | null) {
  const normalized = String(campaign || "")
    .trim()
    .toLowerCase();

  if (normalized === "energy") return "bg-blue-100 text-blue-700";
  if (normalized === "phi") return "bg-purple-100 text-purple-700";
  if (normalized === "nbn") return "bg-green-100 text-green-700";

  return "bg-slate-100 text-slate-600";
}

function statusBadgeClass(status: string | null) {
  const normalized = String(status || "")
    .trim()
    .toLowerCase();

  if (normalized === "sold") return "bg-emerald-100 text-emerald-700";
  if (normalized === "callback") return "bg-blue-100 text-blue-700";
  if (normalized === "lost" || normalized === "rejected")
    return "bg-red-100 text-red-700";
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

/* ============================================================
   METRIC CARD
============================================================ */

function MetricCard({
  label,
  value,
  hint,
  valueClass,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  hint: string;
  valueClass: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        {icon}
      </div>

      <p className={`mt-2 text-2xl font-bold ${valueClass}`}>
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {hint}
      </p>
    </Link>
  );
}

/* ============================================================
   BAR ROW (campaign / pipeline)
============================================================ */

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
  const pct =
    total > 0
      ? Math.min(100, Math.round((count / total) * 100))
      : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">
          {label}
        </span>

        <span className="font-semibold text-slate-900">
          {count}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   TIME FILTER TABS
============================================================ */

const PERIOD_TABS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

/* ============================================================
   DASHBOARD
============================================================ */

export default async function SuperAdminDashboard({
  period = "all",
}: {
  period?: string;
}) {
  const metrics = await getDashboardMetrics(period);

  // Carries the selected period through to every card link, so the
  // destination page (e.g. /leads?status=Sold) shows the same set of
  // leads the card's number was computed from, not the full all-time set.
  function withPeriod(path: string) {
    if (period === "all") return path;
    return `${path}${path.includes("?") ? "&" : "?"}period=${period}`;
  }

  const supabase = await createSupabaseServerClient();

  const { data: recentLeads } = await supabase
    .from("leads")
    .select(`
      id,
      lead_id,
      customer_name,
      mobile,
      status,
      offered_retailer,
      approval_status,
      created_at,
      campaign,
      agent:profiles!leads_assigned_agent_fkey(
        full_name,
        employee_id
      )
    `)
    .order("created_at", {
      ascending: false,
    })
    .limit(8);

  // Placeholder trend data — replace with real daily Sold-lead
  // counts (grouped by day of week) once that query exists.
  const trendData = [1, 0, 2, 0, 1, 0, 1];
  const trendDays = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];
  const maxTrend = Math.max(...trendData, 1);

  return (
    <div className="space-y-6 pb-12">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">

            {PERIOD_TABS.map((tab) => (
              <Link
                key={tab.key}
                href={`/dashboard?period=${tab.key}`}
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

          <a
            href="/api/leads/export"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Download size={16} />
            Export
          </a>

        </div>

      </div>

      {/* =====================================================
          METRIC CARDS
      ===================================================== */}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">

        <MetricCard
          label="Leads"
          value={metrics.totalLeads}
          hint="Total in system"
          valueClass="text-blue-600"
          icon={<FileText size={16} className="text-blue-500" />}
          href={withPeriod("/leads")}
        />

        <MetricCard
          label="Sales"
          value={metrics.sales}
          hint="Marked Sold"
          valueClass="text-emerald-600"
          icon={<DollarSign size={16} className="text-emerald-500" />}
          href={withPeriod("/leads?status=Sold")}
        />

        <MetricCard
          label="Pending"
          value={metrics.pendingApprovals}
          hint="Awaiting approval"
          valueClass="text-amber-600"
          icon={<AlertCircle size={16} className="text-amber-500" />}
          href={withPeriod("/pending-approvals")}
        />

        <MetricCard
          label="Conversion"
          value={`${metrics.conversionRate.toFixed(2)}%`}
          hint="Sold ÷ total leads"
          valueClass="text-slate-800"
          icon={<TrendingUp size={16} className="text-slate-500" />}
          href={withPeriod("/reports")}
        />

        <MetricCard
          label="Customers"
          value={metrics.totalLeads}
          hint="One per lead"
          valueClass="text-violet-600"
          icon={<Users size={16} className="text-violet-500" />}
          href={withPeriod("/leads")}
        />

        <MetricCard
          label="QA Rejected"
          value={metrics.qaRejected}
          hint="Sold then QA-rejected"
          valueClass="text-red-600"
          icon={<ShieldAlert size={16} className="text-red-500" />}
          href={withPeriod("/qa?filter=rejected")}
        />

      </div>

      {/* =====================================================
          MIDDLE GRID
      ===================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* CAMPAIGN + RETAILERS */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <h3 className="mb-4 font-semibold text-slate-800">
            Leads by Campaign
          </h3>

          <div className="space-y-3">

            <BarRow
              label="Energy"
              count={metrics.energyLeads}
              total={metrics.totalLeads}
              barClass="bg-blue-500"
            />

            <BarRow
              label="PHI"
              count={metrics.phiLeads}
              total={metrics.totalLeads}
              barClass="bg-purple-500"
            />

            <BarRow
              label="NBN"
              count={metrics.nbnLeads}
              total={metrics.totalLeads}
              barClass="bg-green-500"
            />

          </div>

          <div className="my-4 border-t border-slate-100" />

          <h4 className="mb-3 text-sm font-semibold text-slate-700">
            Offered retailers
          </h4>

          <div className="space-y-2 text-sm">

            {metrics.retailerBreakdown.length === 0 ? (

              <p className="text-xs text-slate-400">
                No sales yet.
              </p>

            ) : (

              metrics.retailerBreakdown.map((retailer) => (
                <div
                  key={retailer.name}
                  className="flex items-center justify-between"
                >
                  <span className="text-slate-700">
                    {retailer.name}
                  </span>

                  <span className="font-semibold text-slate-900">
                    {retailer.count}
                  </span>
                </div>
              ))

            )}

          </div>

        </div>

        {/* SALES PIPELINE */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <h3 className="mb-4 font-semibold text-slate-800">
            Sales Pipeline
          </h3>

          <div className="space-y-4">

            <BarRow
              label="Sold"
              count={metrics.sales}
              total={metrics.totalLeads}
              barClass="bg-emerald-500"
            />

            <BarRow
              label="Assigned"
              count={metrics.assignedLeads}
              total={metrics.totalLeads}
              barClass="bg-blue-500"
            />

            <BarRow
              label="Pending"
              count={metrics.pendingApprovals}
              total={metrics.totalLeads}
              barClass="bg-amber-500"
            />

            <BarRow
              label="Rejected / Lost"
              count={metrics.qaRejected}
              total={metrics.totalLeads}
              barClass="bg-red-500"
            />

          </div>

        </div>

        {/* SALES TREND */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <h3 className="mb-4 font-semibold text-slate-800">
            Sales trend
          </h3>

          <svg
            viewBox="0 0 280 120"
            className="h-[120px] w-full overflow-visible"
          >
            {trendData.map((value, index) => {
              const slot = 280 / 7;
              const barWidth = 20;
              const x = index * slot + (slot - barWidth) / 2;
              const barHeight = (value / maxTrend) * 90;
              const y = 110 - barHeight;

              return (
                <rect
                  key={index}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={3}
                  fill="#10b981"
                />
              );
            })}
          </svg>

          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            {trendDays.map((day) => (
              <span key={day} className="flex-1 text-center">
                {day}
              </span>
            ))}
          </div>

        </div>

      </div>

      {/* =====================================================
          RECENT LEADS
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center justify-between">

          <h3 className="font-semibold text-slate-800">
            Recent Leads
          </h3>

          <Link
            href="/leads"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            View all
          </Link>

        </div>

        <div className="w-full overflow-x-auto">

          <table className="w-full min-w-[700px] text-left text-sm text-slate-600">

            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400">

              <tr>
                <th className="px-4 py-3">Lead ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Offered Retailer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {recentLeads && recentLeads.length > 0 ? (

                recentLeads.map((lead: any) => (

                  <tr
                    key={lead.id}
                    className="transition hover:bg-slate-50/80"
                  >

                    <td className="px-4 py-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        {lead.lead_id}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {lead.customer_name || "-"}
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">
                      {lead.mobile || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${campaignBadgeClass(
                          lead.campaign
                        )}`}
                      >
                        {lead.campaign || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {lead.offered_retailer || "—"}
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
                  <td
                    colSpan={7}
                    className="py-8 text-center text-slate-400"
                  >
                    No leads available.{" "}

                    <Link
                      href="/leads/new"
                      className="text-blue-600 underline"
                    >
                      Create one now
                    </Link>
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
