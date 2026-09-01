import MainLayout from "@/components/layout/MainLayout";
import LeadsRealtimeRefresher from "@/components/leads/LeadsRealtimeRefresher";
import MyLeadsTable from "@/components/agent/MyLeadsTable";
import { getMyLeads } from "@/lib/myLeads";
import { getCurrentUserProfile } from "@/lib/auth";
import Link from "next/link";

interface Props { searchParams: Promise<{ status?: string; period?: string; search?: string; fuel?: string; campaign?: string; }>; }

function norm(value: unknown) { return String(value ?? "").trim().toLowerCase(); }
function rejectedLead(lead: any) {
  return [norm(lead.status), norm(lead.approval_status), norm(lead.qa_status)].some(v => v === "rejected" || v === "lost");
}

function Card({ title, value, href, tone, hint }: { title: string; value: number | string; href?: string; tone: string; hint: string }) {
  const inner = <div className={`rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}><p className="text-xs font-semibold uppercase tracking-wide opacity-80">{title}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-1 text-xs opacity-75">{hint}</p></div>;
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function MyLeadsPage({ searchParams }: Props) {
  const profile = await getCurrentUserProfile();
  const leads = await getMyLeads();
  const params = await searchParams;
  const status = norm(params.status), period = norm(params.period), search = norm(params.search), fuel = norm(params.fuel), campaign = norm(params.campaign);
  const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });
  const todayKey = dateFormatter.format(new Date());
  const dayKey = (v: string) => dateFormatter.format(new Date(v));
  const todayLeads = leads.filter((l: any) => l.created_at && dayKey(l.created_at) === todayKey);
  const sold = leads.filter((l: any) => norm(l.status) === "sold");
  const followups = leads.filter((l: any) => norm(l.status) === "follow-up");
  const rejected = leads.filter(rejectedLead);

  let filteredLeads = period === "today" ? todayLeads : [...leads];
  if (status) filteredLeads = status === "rejected" ? filteredLeads.filter(rejectedLead) : filteredLeads.filter((l: any) => norm(l.status) === status);
  if (search) filteredLeads = filteredLeads.filter((l: any) => [l.lead_id, l.customer_name, l.mobile, l.nmi, l.mirn].some(v => norm(v).includes(search)));
  if (fuel) filteredLeads = filteredLeads.filter((l: any) => norm(l.fuel_type) === fuel);
  if (campaign) filteredLeads = filteredLeads.filter((l: any) => norm(l.campaign || l.form_type) === campaign);

  const heading = status === "rejected" ? "Rejected Leads" : period === "today" ? "Today's Leads" : "My Leads";

  return <MainLayout>
    <LeadsRealtimeRefresher />

    <div className="space-y-5 pb-8">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="text-xs font-semibold uppercase tracking-wide text-blue-600">Home › My Leads</div><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{heading}</h1><p className="mt-1 text-sm text-slate-500">One place to find, filter and manage every lead assigned to you.</p></div>
          <div className="flex gap-2"><Link href="/agent" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Dashboard</Link>{profile?.role !== "Channel Partner" && <Link href="/leads/new" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">+ New Lead</Link>}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Card title="Total Leads" value={leads.length} href="/my-leads" tone="border-blue-200 bg-white text-blue-700" hint="All your leads" />
        <Card title="Today" value={todayLeads.length} href="/my-leads?period=today" tone="border-indigo-200 bg-indigo-50 text-indigo-700" hint="Created today" />
        <Card title="Sales" value={sold.length} href="/my-leads?status=sold" tone="border-emerald-500 bg-emerald-600 text-white" hint="Sold leads" />
        <Card title="Follow-ups" value={followups.length} href="/my-leads?status=follow-up" tone="border-orange-200 bg-orange-50 text-orange-700" hint="Need a call" />
        <Card title="Rejected" value={rejected.length} href="/my-leads?status=rejected" tone="border-red-200 bg-red-50 text-red-700" hint="Rejected / lost" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Find a lead</h2><p className="text-xs text-slate-500">Search by Lead ID or customer name, then filter by status, fuel or form.</p></div><span className="text-xs font-semibold text-slate-500">Showing {filteredLeads.length} of {leads.length}</span></div>
        <form className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]" method="get">
          <input name="search" defaultValue={params.search || ""} placeholder="Search Lead ID, Customer Name..." className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <select name="status" defaultValue={params.status || ""} className="rounded-lg border border-slate-300 px-4 py-3"><option value="">All Status</option><option value="follow-up">Follow-up</option><option value="interested">Interested</option><option value="processing">Processing</option><option value="sold">Sold</option><option value="lost">Lost</option><option value="no answer">No Answer</option><option value="internal dnc">Internal DNC</option><option value="rejected">Rejected</option></select>
          <select name="fuel" defaultValue={params.fuel || ""} className="rounded-lg border border-slate-300 px-4 py-3"><option value="">All Fuel</option><option value="single">Single</option><option value="dual">Dual</option><option value="gas">Gas</option></select>
          <select name="campaign" defaultValue={params.campaign || ""} className="rounded-lg border border-slate-300 px-4 py-3"><option value="">All Forms</option><option value="energy">Energy</option><option value="phi">PHI</option><option value="nbn">NBN</option></select>
          <button className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Search</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/my-leads" className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">Clear filters</Link>
          {period === "today" && <span className="rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700">Today</span>}
          {status && <span className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">Status: {status}</span>}
        </div>
      </div>

      <MyLeadsTable leads={filteredLeads} />
    </div>
  </MainLayout>;
}
