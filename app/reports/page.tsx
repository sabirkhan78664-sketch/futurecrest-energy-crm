import MainLayout from "@/components/layout/MainLayout";
import LeadsRealtimeRefresher from "@/components/leads/LeadsRealtimeRefresher";
import { adminSupabase } from "@/lib/admin";
import { getCurrentUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import ExportButton from "./ExportButton";

export const dynamic = "force-dynamic";

const PERIOD_TABS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

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

interface ReportsPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { period = "all" } = await searchParams;
  const profile = await getCurrentUserProfile();

  if (!profile) redirect("/login");

  const allowedRoles = ["Agent", "QA", "Admin", "Super Admin", "Closer"];
  if (!allowedRoles.includes(profile.role)) redirect("/unauthorized");

  // Agents get a simple report containing only their own leads.
  const isAgent = profile.role === "Agent";

  const query = adminSupabase
    .from("leads")
    .select(
      "id, lead_id, customer_name, mobile, email, status, fuel_type, created_at, approval_status, qa_status, assigned_agent, assigned_closer, channel_name, offered_retailer, campaign"
    )
    .order("created_at", { ascending: false });

  if (isAgent) {
    query.eq("assigned_agent", profile.id);
  }

  const { data: leads, error } = await query;

  if (error) console.error("Reports lead query error:", error);

  const allLeads = leads || [];
  const totalLeads = allLeads.length;
  const sold = allLeads.filter((l: any) => l.status === "Sold").length;
  const callbacks = allLeads.filter((l: any) => l.status === "Callback").length;
  const lost = allLeads.filter(
    (l: any) => l.status === "Lost"
  ).length;

  const conversionRate =
    totalLeads > 0 ? ((sold / totalLeads) * 100).toFixed(1) : "0.0";

  if (isAgent) {
    return (
      <MainLayout>
        <LeadsRealtimeRefresher />
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">My Reports</h1>
            <p className="text-slate-500">
              Simple performance summary for your leads.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link href="/my-leads" className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-semibold text-slate-500">My Leads</p>
              <p className="mt-1 text-3xl font-bold">{totalLeads}</p>
            </Link>
            <Link href="/my-leads?status=sold" className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-semibold text-slate-500">Sold</p>
              <p className="mt-1 text-3xl font-bold text-green-600">{sold}</p>
            </Link>
            <Link href="/my-leads?status=callback" className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-sm font-semibold text-slate-500">Callback</p>
              <p className="mt-1 text-3xl font-bold text-amber-600">{callbacks}</p>
            </Link>
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Conversion</p>
              <p className="mt-1 text-3xl font-bold text-blue-600">
                {conversionRate}%
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-600" />
              <h2 className="text-xl font-bold">My Lead Status</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Link href="/my-leads" className="rounded-lg bg-slate-50 p-4 transition hover:bg-slate-100">
                <p className="text-xs font-semibold text-slate-500">Total</p>
                <p className="mt-1 text-2xl font-bold">{totalLeads}</p>
              </Link>
              <Link href="/my-leads?status=sold" className="rounded-lg bg-green-50 p-4 transition hover:bg-green-100">
                <p className="text-xs font-semibold text-green-700">Sold</p>
                <p className="mt-1 text-2xl font-bold text-green-800">{sold}</p>
              </Link>
              <Link href="/my-leads?status=callback" className="rounded-lg bg-amber-50 p-4 transition hover:bg-amber-100">
                <p className="text-xs font-semibold text-amber-700">Callback</p>
                <p className="mt-1 text-2xl font-bold text-amber-800">{callbacks}</p>
              </Link>
              <Link href="/my-leads?status=lost" className="rounded-lg bg-red-50 p-4 transition hover:bg-red-100">
                <p className="text-xs font-semibold text-red-700">Lost</p>
                <p className="mt-1 text-2xl font-bold text-red-800">{lost}</p>
              </Link>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/my-leads"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
            >
              My Leads
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const totalSales = sold;
  const soldNotAudited = allLeads.filter(
    (l: any) =>
      l.status === "Sold" &&
      l.qa_status !== "Approved" &&
      l.qa_status !== "Rejected"
  ).length;
  const qaApproved = allLeads.filter(
    (l: any) => l.status === "Sold" && l.qa_status === "Approved"
  ).length;
  const qaRejected = allLeads.filter(
    (l: any) => l.status === "Sold" && l.qa_status === "Rejected"
  ).length;

  const statusCounts = allLeads.reduce((acc: Record<string, number>, lead: any) => {
    const status = lead.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Group leads by channel_name. Leads with null/empty channel_name
  // go into an "Direct / Unknown" bucket. Scoped to the selected period
  // (by created_at) so the Today/Week/Month tabs actually filter it.
  const periodStart = getPeriodStart(period);
  const channelSourceLeads = periodStart
    ? allLeads.filter(
        (lead: any) => lead.created_at && new Date(lead.created_at) >= periodStart
      )
    : allLeads;

  const channelMap: Record<string, {
    name: string;
    total: number;
    sold: number;
    pending: number;
    rejected: number;
    campaigns: Record<string, number>;
  }> = {};

  channelSourceLeads.forEach((lead: any) => {
    const ch = lead.channel_name?.trim() || "Direct / Unknown";
    if (!channelMap[ch]) {
      channelMap[ch] = { name: ch, total: 0, sold: 0, pending: 0,
                          rejected: 0, campaigns: {} };
    }
    channelMap[ch].total++;
    if (lead.status === "Sold" && lead.qa_status !== "Rejected")
      channelMap[ch].sold++;
    if (lead.approval_status === "Pending")
      channelMap[ch].pending++;
    if (lead.qa_status === "Rejected")
      channelMap[ch].rejected++;
    const camp = lead.campaign || "Unknown";
    channelMap[ch].campaigns[camp] =
      (channelMap[ch].campaigns[camp] || 0) + 1;
  });

  const channelRows = Object.values(channelMap)
    .sort((a, b) => b.total - a.total);

  const channelTotals = channelRows.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      sold: acc.sold + row.sold,
    }),
    { total: 0, sold: 0 }
  );

  function campaignBadgeClass(campaign: string) {
    const normalized = campaign.toLowerCase();
    if (normalized === "energy") return "bg-blue-100 text-blue-700";
    if (normalized === "phi") return "bg-purple-100 text-purple-700";
    if (normalized === "nbn") return "bg-green-100 text-green-700";
    return "bg-slate-100 text-slate-600";
  }

  function conversionClass(rate: number) {
    if (rate >= 20) return "text-emerald-600";
    if (rate >= 10) return "text-amber-600";
    return "text-red-600";
  }

  return (
    <MainLayout>
      <LeadsRealtimeRefresher />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-slate-500">
              Sales, lead status and Post-Sale QA performance
            </p>
          </div>
          {["Admin", "Super Admin"].includes(profile.role) && (
            <ExportButton leads={allLeads} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <Link href="/leads" className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-sm font-semibold text-slate-500">All Leads</p>
            <p className="mt-1 text-3xl font-bold">{totalLeads}</p>
          </Link>
          <Link href="/leads?status=Sold" className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2 text-green-600"><TrendingUp size={18}/><p className="text-sm font-semibold">Sold</p></div>
            <p className="mt-1 text-3xl font-bold">{totalSales}</p>
          </Link>
          <Link href="/qa?filter=not-audited" className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2 text-amber-600"><ShieldCheck size={18}/><p className="text-sm font-semibold">Audit Available</p></div>
            <p className="mt-1 text-3xl font-bold">{soldNotAudited}</p>
          </Link>
          <Link href="/qa?filter=approved" className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2 text-green-600"><CheckCircle2 size={18}/><p className="text-sm font-semibold">QA Approved</p></div>
            <p className="mt-1 text-3xl font-bold">{qaApproved}</p>
          </Link>
          <Link href="/qa?filter=rejected" className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-2 text-red-600"><XCircle size={18}/><p className="text-sm font-semibold">QA Rejected</p></div>
            <p className="mt-1 text-3xl font-bold">{qaRejected}</p>
          </Link>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Performance Summary</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Link
                key={status}
                href={`/leads?status=${encodeURIComponent(status)}`}
                className="rounded-lg border bg-slate-50 p-4 transition hover:bg-slate-100"
              >
                <p className="text-xs font-semibold text-slate-500">{status}</p>
                <p className="mt-1 text-2xl font-bold">{count}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Post-Sale QA Summary</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link href="/qa?filter=not-audited" className="rounded-lg bg-amber-50 p-4 transition hover:bg-amber-100"><p className="text-sm font-semibold text-amber-800">Audit Available</p><p className="mt-1 text-2xl font-bold">{soldNotAudited}</p></Link>
            <Link href="/qa?filter=approved" className="rounded-lg bg-green-50 p-4 transition hover:bg-green-100"><p className="text-sm font-semibold text-green-800">QA Approved</p><p className="mt-1 text-2xl font-bold">{qaApproved}</p></Link>
            <Link href="/qa?filter=rejected" className="rounded-lg bg-red-50 p-4 transition hover:bg-red-100"><p className="text-sm font-semibold text-red-800">QA Rejected</p><p className="mt-1 text-2xl font-bold">{qaRejected}</p></Link>
          </div>
        </div>

        {!isAgent && (profile.role === "Admin" || profile.role === "Super Admin") && (
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                <h2 className="text-xl font-bold">Channel Performance</h2>
              </div>

              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
                {PERIOD_TABS.map((tab) => (
                  <Link
                    key={tab.key}
                    href={`/reports?period=${tab.key}`}
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
            </div>

            {channelRows.length === 0 ? (
              <p className="py-8 text-center text-slate-400">
                No channel partner data yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm text-slate-600">
                    <thead className="border-b bg-slate-50 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Channel</th>
                        <th className="px-4 py-3">Leads</th>
                        <th className="px-4 py-3">Sold</th>
                        <th className="px-4 py-3">Conversion</th>
                        <th className="px-4 py-3">Pending</th>
                        <th className="px-4 py-3">QA Rejected</th>
                        <th className="px-4 py-3">Campaigns</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {channelRows.map((row) => {
                        const conversion =
                          row.total > 0 ? (row.sold / row.total) * 100 : 0;

                        return (
                          <tr key={row.name} className="transition hover:bg-slate-50/80">
                            <td className="px-4 py-3">
                              {row.name === "Direct / Unknown" ? (
                                <span className="italic text-slate-400">{row.name}</span>
                              ) : (
                                <span className="font-medium text-slate-900">{row.name}</span>
                              )}
                            </td>

                            <td className="px-4 py-3">{row.total}</td>

                            <td className="px-4 py-3 font-semibold text-emerald-600">
                              {row.sold}
                            </td>

                            <td className={`px-4 py-3 font-semibold ${conversionClass(conversion)}`}>
                              {conversion.toFixed(1)}%
                            </td>

                            <td className="px-4 py-3 text-amber-600">
                              {row.pending > 0 ? row.pending : "—"}
                            </td>

                            <td className="px-4 py-3 text-red-600">
                              {row.rejected > 0 ? row.rejected : "—"}
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(row.campaigns).map(([camp, count]) => (
                                  <span
                                    key={camp}
                                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${campaignBadgeClass(camp)}`}
                                  >
                                    {camp} {count}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot>
                      <tr className="border-t bg-slate-50 font-semibold text-slate-800">
                        <td className="px-4 py-3">Total</td>
                        <td className="px-4 py-3">{channelTotals.total}</td>
                        <td className="px-4 py-3 text-emerald-600">{channelTotals.sold}</td>
                        <td className="px-4 py-3">
                          {channelTotals.total > 0
                            ? `${((channelTotals.sold / channelTotals.total) * 100).toFixed(1)}%`
                            : "0.0%"}
                        </td>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">—</td>
                        <td className="px-4 py-3">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
