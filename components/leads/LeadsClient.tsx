"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CalendarDays,
  DollarSign,
  PhoneCall,
  XCircle,
  Search,
} from "lucide-react";
import LeadToolbar from "./LeadToolbar";
import LeadTable from "./LeadTable";
import LeadsRealtimeRefresher from "./LeadsRealtimeRefresher";

interface Lead {
  id: number;
  lead_id: string;
  cl_id?: string | null;
  channel_name?: string | null;
  customer_name: string;
  mobile: string;
  alternate_mobile?: string | null;
  email?: string | null;
  nmi: string | null;
  mirn?: string | null;
  campaign: string | null;
  assigned_agent: string | null;
  assigned_closer: string | null;
  fuel_type: string | null;
  current_retailer: string;
  offered_retailer: string | null;
  status: string | null;
  created_by: string | null;

  creator?: {
    id: string;
    employee_id: string | null;
    full_name: string | null;
    username: string | null;
  } | null;

  assignedAgent?: {
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
  closed_at?: string | null;
}

interface InitialFilters {
  search: string;
  status: string;
  campaign: string;
  period: string;
}

interface Props {
  leads: Lead[];
  role: string;
  initialFilters: InitialFilters;
  todayStartIST: string;
  mode?: "leads" | "pending";
}

const PERIOD_LABELS: Record<string, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};

const PERIOD_TABS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

// Evaluated in the business's own timezone (Asia/Kolkata) regardless of
// the viewer's own machine/browser timezone — safe to run client-side
// since an explicit IANA zone is passed to Intl.DateTimeFormat.
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getPeriodStart(
  period: string,
  todayStartIST: string
): Date | null {
  if (period === "today") {
    return new Date(todayStartIST);
  }

  const now = new Date();

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

// Search mode overrides every other filter — searches the full
// role-permitted dataset, not whatever the normal filters would show.
function globalSearch(leads: Lead[], query: string) {
  const q = query.trim().toLowerCase();

  if (!q) return leads;

  return leads.filter((lead) => {
    const values: Array<string | number | null | undefined> = [
      lead.id,
      lead.lead_id,
      lead.cl_id,
      lead.customer_name,
      lead.mobile,
      lead.alternate_mobile,
      lead.email,
      lead.nmi,
      lead.mirn,
      lead.campaign,
      lead.channel_name,
      lead.current_retailer,
      lead.offered_retailer,
      lead.assignedAgent?.employee_id,
      lead.assignedAgent?.full_name,
      lead.closer?.employee_id,
      lead.closer?.full_name,
    ];

    return values.some((value) => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(q);
    });
  });
}

// The one common filtering pipeline used for both the table and the
// metric cards — Sold leads bucket by closed_at (when the outcome was
// actually recorded), everything else by created_at. Multiple values
// within one filter are OR'd together (e.g. Fuel: Single + Dual); the
// six filters themselves AND together, same as before.
function applyNormalFilters(
  leads: Lead[],
  filters: {
    period: string;
    status: string[];
    fuel: string[];
    campaign: string[];
    agent: string[];
    channel: string[];
  },
  todayStartIST: string
) {
  let result = leads;

  if (filters.status.length > 0) {
    result = result.filter(
      (lead) => lead.status !== null && filters.status.includes(lead.status)
    );
  }

  if (filters.fuel.length > 0) {
    result = result.filter(
      (lead) =>
        lead.fuel_type !== null && filters.fuel.includes(lead.fuel_type)
    );
  }

  if (filters.campaign.length > 0) {
    result = result.filter(
      (lead) =>
        lead.campaign !== null && filters.campaign.includes(lead.campaign)
    );
  }

  if (filters.agent.length > 0) {
    result = result.filter(
      (lead) =>
        lead.assigned_agent !== null &&
        filters.agent.includes(lead.assigned_agent)
    );
  }

  if (filters.channel.length > 0) {
    result = result.filter(
      (lead) =>
        lead.channel_name != null &&
        filters.channel.includes(lead.channel_name)
    );
  }

  const periodStart = getPeriodStart(filters.period, todayStartIST);

  if (periodStart) {
    result = result.filter((lead) => {
      const isSold = lead.status === "Sold";
      const dateValue = isSold ? lead.closed_at : lead.created_at;

      if (!dateValue) return false;

      return new Date(dateValue) >= periodStart;
    });
  }

  return result;
}

export default function LeadsClient({
  leads,
  role,
  initialFilters,
  todayStartIST,
  mode = "leads",
}: Props) {
  const [search, setSearch] = useState(initialFilters.search);
  const [status, setStatus] = useState<string[]>(
    initialFilters.status ? [initialFilters.status] : []
  );
  const [fuel, setFuel] = useState<string[]>([]);
  const [agent, setAgent] = useState<string[]>([]);
  const [campaign, setCampaign] = useState<string[]>(
    initialFilters.campaign ? [initialFilters.campaign] : []
  );
  const [channelName, setChannelName] = useState<string[]>([]);
  const [period, setPeriod] = useState(initialFilters.period);

  const uniqueAgents = useMemo(() => {
    // The filter needs to match on assigned_agent (a profile UUID), but the
    // dropdown should show a human-readable name rather than the raw UUID —
    // resolve it from the enriched `assignedAgent` profile (looked up directly
    // by assigned_agent, so it's correct even when an Admin reassigned the
    // lead and created_by !== assigned_agent). Falls back to the `creator`
    // match, then the raw UUID, only if that lookup came back empty.
    const nameById = new Map<string, string>();

    leads.forEach((lead) => {
      if (!lead.assigned_agent || nameById.has(lead.assigned_agent)) {
        return;
      }

      const profile =
        lead.assignedAgent ??
        (lead.created_by === lead.assigned_agent ? lead.creator : null);

      const label =
        profile?.full_name ||
        profile?.username ||
        profile?.employee_id ||
        lead.assigned_agent;

      nameById.set(lead.assigned_agent, label);
    });

    return Array.from(nameById.entries()).map(([id, label]) => ({
      id,
      label,
    }));
  }, [leads]);

  const uniqueChannels = useMemo(() => {
    return Array.from(
      new Set(
        leads
          .map((lead) => lead.channel_name)
          .filter(Boolean)
      )
    ) as string[];
  }, [leads]);

  const isSearchMode = search.trim().length > 0;

  const finalLeads = useMemo(() => {
    if (isSearchMode) {
      return globalSearch(leads, search);
    }

    return applyNormalFilters(
      leads,
      { period, status, fuel, campaign, agent, channel: channelName },
      todayStartIST
    );
  }, [
    leads,
    isSearchMode,
    search,
    period,
    status,
    fuel,
    campaign,
    agent,
    channelName,
    todayStartIST,
  ]);

  // ============================================================
  // METRICS — always computed from finalLeads, the exact same
  // dataset the table renders. Never a second/separate dataset.
  // ============================================================

  const totalLeads = finalLeads.length;

  const today = dayFormatter.format(new Date());

  const todayLeads = finalLeads.filter(
    (lead) =>
      lead.created_at &&
      dayFormatter.format(new Date(lead.created_at)) === today
  ).length;

  const sales = finalLeads.filter(
    (lead) => String(lead.status || "").toLowerCase() === "sold"
  ).length;

  const followups = finalLeads.filter(
    (lead) => String(lead.status || "").toLowerCase() === "follow-up"
  ).length;

  const rejected = finalLeads.filter(
    (lead) =>
      String(lead.status || "").toLowerCase() === "rejected" ||
      String(lead.status || "").toLowerCase() === "lost"
  ).length;

  const periodQualifier =
    !isSearchMode && period !== "all" && PERIOD_LABELS[period]
      ? ` (${PERIOD_LABELS[period]})`
      : "";

  const pageTitle =
    role === "Closer"
      ? "Leads"
      : role === "Agent" || role === "Channel Partner"
        ? "My Leads"
        : "Lead Management";

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {pageTitle}
          </h1>

          <p className="text-slate-500">
            Manage FutureCrest Energy Leads
          </p>

          {isSearchMode && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                <Search size={12} />
                Global search active — filters temporarily ignored
              </span>
            </div>
          )}

          {!isSearchMode && status.length > 0 && (
            <div className="mt-2 text-sm text-slate-500">
              Filter:
              <span className="ml-2 rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                {status.join(", ")}
              </span>
            </div>
          )}

          {!isSearchMode && campaign.length > 0 && (
            <div className="mt-2 text-sm text-slate-500">
              Form:
              <span className="ml-2 rounded-md bg-purple-50 px-2 py-1 font-semibold text-purple-700">
                {campaign.join(", ")}
              </span>
            </div>
          )}

          {!isSearchMode && PERIOD_LABELS[period] && (
            <div className="mt-2 text-sm text-slate-500">
              Showing:
              <span className="ml-2 rounded-md bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                {PERIOD_LABELS[period]}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">

            {PERIOD_TABS.map((tab) => {
              const isActive = period === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setPeriod(tab.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

          </div>

          <Link
            href="/leads/new"
            className="rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
          >
            + New Lead
          </Link>

        </div>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-6">

        <StatCard
          title={`Total Leads${periodQualifier}`}
          value={totalLeads}
          color="text-blue-600"
          icon={<FileText size={16} className="text-blue-500" />}
          onClick={() => {
            setSearch("");
            setStatus([]);
          }}
        />

        <StatCard
          title="Today's Leads"
          value={todayLeads}
          color="text-indigo-600"
          icon={<CalendarDays size={16} className="text-indigo-500" />}
          onClick={() => {
            setSearch("");
            setPeriod("today");
          }}
        />

        <StatCard
          title={`Sales${periodQualifier}`}
          value={sales}
          color="text-green-600"
          icon={<DollarSign size={16} className="text-green-500" />}
          onClick={() => {
            setSearch("");
            setStatus(["Sold"]);
          }}
        />

        <StatCard
          title={`Follow-ups${periodQualifier}`}
          value={followups}
          color="text-yellow-600"
          icon={<PhoneCall size={16} className="text-yellow-500" />}
          onClick={() => {
            setSearch("");
            setStatus(["Follow-up"]);
          }}
        />

        <StatCard
          title={`Rejected${periodQualifier}`}
          value={rejected}
          color="text-red-600"
          icon={<XCircle size={16} className="text-red-500" />}
          onClick={() => {
            setSearch("");
            setStatus(["Rejected"]);
          }}
        />

      </div>

      <LeadsRealtimeRefresher />

      <LeadToolbar
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        fuel={fuel}
        setFuel={setFuel}
        agent={agent}
        setAgent={setAgent}
        campaign={campaign}
        setCampaign={setCampaign}
        channelName={channelName}
        setChannelName={setChannelName}
        setPeriod={setPeriod}
        uniqueAgents={uniqueAgents}
        uniqueChannels={uniqueChannels}
      />

      {/* =====================================================
          NO SEARCH RESULTS
      ===================================================== */}

      {isSearchMode && finalLeads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
            🔎
          </div>

          <h2 className="text-xl font-semibold text-slate-900">
            No leads found
          </h2>

          <p className="mt-2 text-slate-500">
            No permitted leads match &quot;{search}&quot;.
          </p>

          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
          >
            Clear Search
          </button>

        </div>
      ) : (
        <LeadTable
          leads={finalLeads}
          mode={mode}
        />
      )}

    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function StatCard({
  title,
  value,
  color,
  icon,
  onClick,
}: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        {icon}
      </div>

      <h2
        className={`mt-3 text-3xl font-bold ${color}`}
      >
        {value}
      </h2>

      <p className="mt-2 text-xs font-medium text-slate-400 transition group-hover:text-blue-600">
        View leads →
      </p>
    </button>
  );
}
