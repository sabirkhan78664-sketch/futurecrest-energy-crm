import MainLayout from "@/components/layout/MainLayout";
import { requireRole } from "@/lib/auth";
import { getAgents } from "@/lib/agents";
import PartnerDashboard from "@/components/closers/dashboard/PartnerDashboard";
import LeadsRealtimeRefresher from "@/components/leads/LeadsRealtimeRefresher";
import StateClocks from "@/components/dashboard/StateClocks";
import Link from "next/link";

function pct(value: number, total: number) {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

function normalize(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function rejectedLead(lead: any) {
  return [normalize(lead.status), normalize(lead.approval_status), normalize(lead.qa_status)]
    .some(value => value === "rejected" || value === "lost");
}

interface Props {
  searchParams: Promise<{ period?: string }>;
}

export default async function AgentsListPage({ searchParams }: Props) {
  const { profile } = await requireRole(["Agent", "Channel Partner", "Admin", "Super Admin"]);

  if (profile.role === "Channel Partner") {
    const { period = "today" } = await searchParams;

    return (
      <MainLayout>
        <LeadsRealtimeRefresher />
        <PartnerDashboard profile={profile} period={period} />
      </MainLayout>
    );
  }

  if (profile.role === "Agent") {
    const { getMyLeads } = await import("@/lib/myLeads");
    // Single source of truth: Dashboard and My Leads both use this exact list.
    const leads = await getMyLeads();

    const dateFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    });
    const todayKey = dateFormatter.format(new Date());
    const dayKey = (value: string) => dateFormatter.format(new Date(value));
    const status = (lead: any) => normalize(lead.status);
    const approval = (lead: any) => normalize(lead.approval_status);

    const todayLeads = leads.filter((l: any) => l.created_at && dayKey(l.created_at) === todayKey);
    const sold = leads.filter((l: any) => status(l) === "sold");
    // Bucketed by closed_at (when it was actually marked Sold), not
    // created_at — an old lead sold today is still today's sale.
    const todaySales = sold.filter((l: any) => l.closed_at && dayKey(l.closed_at) === todayKey);
    const followups = leads.filter((l: any) => status(l) === "follow-up");
    const rejected = leads.filter(rejectedLead);
    const approved = leads.filter((l: any) => approval(l) === "approved");

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - index));
      const key = dateFormatter.format(d);
      const label = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(d);
      const dayLeads = leads.filter((l: any) => l.created_at && dayKey(l.created_at) === key);
      const daySales = sold.filter((l: any) => l.closed_at && dayKey(l.closed_at) === key);
      return { key, label, leads: dayLeads.length, sales: daySales.length };
    });
    const maxGraph = Math.max(1, ...last7Days.map(d => Math.max(d.leads, d.sales)));

    const cards = [
      { title: "Today Leads", value: todayLeads.length, href: "/my-leads?period=today", icon: "📥", cls: "border-blue-200 bg-white", valueCls: "text-blue-700", iconCls: "bg-blue-50", sub: "Open today's leads" },
      { title: "Today Sales", value: todaySales.length, href: "/my-leads?status=sold&period=today", icon: "✓", cls: "border-emerald-500 bg-emerald-600", valueCls: "text-white", titleCls: "text-white", iconCls: "bg-white/15 text-white", subCls: "text-emerald-100", sub: "Sold today" },
      { title: "All Leads", value: leads.length, href: "/my-leads", icon: "▤", cls: "border-indigo-200 bg-indigo-50", valueCls: "text-indigo-700", titleCls: "text-indigo-700", iconCls: "bg-white text-indigo-600", subCls: "text-indigo-600", sub: "Everything assigned to you" },
      { title: "All Sales", value: sold.length, href: "/my-leads?status=sold", icon: "$", cls: "border-emerald-200 bg-emerald-50", valueCls: "text-emerald-700", titleCls: "text-emerald-700", iconCls: "bg-white text-emerald-600", subCls: "text-emerald-600", sub: "Your sold leads" },
      { title: "Rejected", value: rejected.length, href: "/my-leads?status=rejected", icon: "×", cls: "border-red-200 bg-red-50", valueCls: "text-red-800", titleCls: "text-red-700", iconCls: "bg-white text-red-600", subCls: "text-red-600", sub: "Open rejected leads" },
      { title: "Follow-ups", value: followups.length, href: "/my-leads?status=followup", icon: "↗", cls: "border-orange-200 bg-white", valueCls: "text-orange-600", iconCls: "bg-orange-50 text-orange-600", sub: "Leads to follow up" },
      { title: "Approval Rate", value: pct(approved.length, leads.length), href: "/my-leads", icon: "%", cls: "border-slate-200 bg-white", valueCls: "text-slate-900", iconCls: "bg-slate-100 text-slate-700", sub: "Approved / all your leads" },
    ];

    return (
      <MainLayout>
        <LeadsRealtimeRefresher />
        <div className="space-y-5 pb-8">
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">Home › Agent</div>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Agent Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">Welcome back, {profile.full_name || "Agent"}. Here is your work at a glance.</p>
              </div>
              <div className="flex gap-2">
                <Link href="/my-leads" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">My Leads</Link>
                <Link href="/leads/new" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">+ New Lead</Link>
              </div>
            </div>
          </div>

          <StateClocks />

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {cards.map(card => {
              const content = (
                <div className={`h-full rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.cls}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wide ${card.titleCls || "text-slate-500"}`}>{card.title}</p>
                      <p className={`mt-2 text-3xl font-bold ${card.valueCls}`}>{card.value}</p>
                    </div>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${card.iconCls}`}>{card.icon}</span>
                  </div>
                  <p className={`mt-3 text-xs ${card.subCls || "text-slate-500"}`}>{card.sub}</p>
                </div>
              );
              return card.href ? <Link key={card.title} href={card.href}>{content}</Link> : <div key={card.title}>{content}</div>;
            })}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between">
                <div><h2 className="text-lg font-bold text-slate-900">Your Activity</h2><p className="text-sm text-slate-500">Last 7 days</p></div>
                <div className="flex gap-3 text-xs font-semibold text-slate-500"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-blue-500" />Leads</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Sales</span></div>
              </div>
              <div className="mt-5 grid h-44 grid-cols-7 items-end gap-2 border-b border-slate-200 px-1">
                {last7Days.map(day => (
                  <div key={day.key} className="flex h-full items-end justify-center gap-1" title={`${day.label}: ${day.leads} leads, ${day.sales} sales`}>
                    <div className="w-3 rounded-t bg-blue-500" style={{ height: day.leads ? `${Math.max(8, day.leads / maxGraph * 100)}%` : "0%" }} />
                    <div className="w-3 rounded-t bg-emerald-500" style={{ height: day.sales ? `${Math.max(8, day.sales / maxGraph * 100)}%` : "0%" }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 text-center text-xs text-slate-400">{last7Days.map(day => <span key={day.key}>{day.label}</span>)}</div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
              <div className="mt-4 grid gap-2">
                <Link href="/my-leads" className="rounded-lg border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50">📋 Open My Leads <span className="float-right">{leads.length}</span></Link>
                <Link href="/my-leads?status=followup" className="rounded-lg border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50">📞 Follow-ups <span className="float-right text-orange-600">{followups.length}</span></Link>
                <Link href="/my-leads?status=sold" className="rounded-lg border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50">💰 Sold Leads <span className="float-right text-emerald-600">{sold.length}</span></Link>
                <Link href="/messages" className="rounded-lg border border-slate-200 p-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50">💬 Messages <span className="float-right">Open</span></Link>
              </div>
            </section>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            <b>Tip:</b> Use <b>My Leads</b> to search, filter and open a lead. Dashboard numbers always come from the same lead list, so <b>All Leads</b> matches your My Leads total.
          </div>
        </div>
      </MainLayout>
    );
  }

  const agents = await getAgents();
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-3xl font-bold">Agents</h1><p className="text-slate-500">Manage FutureCrest Energy agents</p></div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr><th className="px-6 py-3">Employee ID</th><th className="px-6 py-3">Name</th><th className="px-6 py-3">Username</th><th className="px-6 py-3">Status</th></tr></thead>
            <tbody>
              {agents.length === 0 ? <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No agents found.</td></tr> :
                agents.map((agent: any) => <tr key={agent.id} className="border-t hover:bg-slate-50">
                  <td className="px-6 py-4"><Link href={`/agents/${agent.id}`} className="font-medium text-blue-600 hover:underline">{agent.employee_id ?? "-"}</Link></td>
                  <td className="px-6 py-4">{agent.full_name ?? "-"}</td><td className="px-6 py-4">{agent.username ?? "-"}</td><td className="px-6 py-4">{agent.status ?? "-"}</td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
