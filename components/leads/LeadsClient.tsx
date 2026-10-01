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
import { CHANNEL_OPTIONS } from "@/lib/leadOptions";
import { getPeriodRange, validateCustomRange } from "@/lib/timezone";
import DashboardPeriodTabs from "@/components/dashboard/DashboardPeriodTabs";

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
  // Set on Channel Partner submissions (which have no assigned_agent).
  partner_code?: string | null;
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
  periodFrom?: string;
  periodTo?: string;
}

interface ChannelPartner {
  id: string;
  full_name: string | null;
  employee_id: string | null;
  partner_code: string | null;
}

interface Props {
  leads: Lead[];
  role: string;
  initialFilters: InitialFilters;
  todayStartIST: string;
  mode?: "leads" | "pending";
  // Channel Partner users whose partner_code appears on these leads —
  // lets the Agent filter list them as people (never as channels).
  channelPartners?: ChannelPartner[];
}

// Stable default so the memos below don't recompute every render.
const NO_PARTNERS: ChannelPartner[] = [];

const PERIOD_LABELS: Record<string, string> = {
  all: "All time",
  today: "Today",
  yesterday: "Yesterday",
  last_week: "Last week",
  last_month: "Last month",
  custom: "Custom range",
  week: "This week",
  month: "This month",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2026-09-10" -> "10 Sep 2026" (plain string split, no timezone shift).
function formatDay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);

  return `${day} ${MONTHS[month - 1]} ${year}`;
}

// Label for the active period, including periods that have no tab here
// (arriving from the Dashboard): Yesterday, Last week, Last month, Custom.
function getPeriodLabel(period: string, from?: string, to?: string) {
  if (period === "custom") {
    if (validateCustomRange({ from, to })) return "Custom range";

    const [first, last] =
      String(from) <= String(to) ? [from, to] : [to, from];

    return `${formatDay(String(first))} - ${formatDay(String(last))}`;
  }

  return PERIOD_LABELS[period] ?? null;
}

// Evaluated in the business's own timezone (Asia/Kolkata) regardless of
// the viewer's own machine/browser timezone — safe to run client-side
// since an explicit IANA zone is passed to Intl.DateTimeFormat.
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

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
    periodFrom?: string;
    periodTo?: string;
    status: string[];
    fuel: string[];
    campaign: string[];
    agent: string[];
    channel: string[];
  },
  todayStartIST: string,
  partnerIdByCode: Map<string, string>
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

  // A lead belongs to a selected person when they are its Assigned
  // Agent, or the Channel Partner whose partner_code it carries.
  if (filters.agent.length > 0) {
    result = result.filter((lead) => {
      const partnerId = lead.partner_code
        ? partnerIdByCode.get(lead.partner_code)
        : undefined;

      return (
        (lead.assigned_agent !== null &&
          filters.agent.includes(lead.assigned_agent)) ||
        (partnerId !== undefined && filters.agent.includes(partnerId))
      );
    });
  }

  if (filters.channel.length > 0) {
    result = result.filter(
      (lead) =>
        lead.channel_name != null &&
        filters.channel.includes(lead.channel_name)
    );
  }

  // Fixed calendar range in the business timezone (Today / Mon-Sat
  // week / calendar month), start inclusive, end exclusive.
  const periodRange = getPeriodRange(
    filters.period,
    undefined,
    undefined,
    { from: filters.periodFrom, to: filters.periodTo }
  );

  if (periodRange) {
    result = result.filter((lead) => {
      const isSold = lead.status === "Sold";
      const dateValue = isSold ? lead.closed_at : lead.created_at;

      if (!dateValue) return false;

      const date = new Date(dateValue);

      return date >= periodRange.start && date < periodRange.end;
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
  channelPartners = NO_PARTNERS,
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
  const [customFrom, setCustomFrom] = useState(
    initialFilters.periodFrom ?? ""
  );
  const [customTo, setCustomTo] = useState(
    initialFilters.periodTo ?? ""
  );

  const partnerIdByCode = useMemo(
    () =>
      new Map(
        channelPartners
          .filter((partner) => partner.partner_code)
          .map((partner) => [String(partner.partner_code), partner.id])
      ),
    [channelPartners]
  );

  const uniqueAgents = useMemo(() => {
    // PEOPLE associated with these leads: each Assigned Agent (Agent or
    // Channel Partner profile, keyed by assigned_agent) plus each Channel
    // Partner whose partner_code a lead carries. Labelled by name with
    // the employee ID beneath — never the raw UUID.
    const people = new Map<
      string,
      { id: string; label: string; description: string | null }
    >();

    function addPerson(id: string, profile: any) {
      if (people.has(id)) return;

      const label =
        profile?.full_name ||
        profile?.username ||
        profile?.employee_id ||
        "Unknown user";

      people.set(id, {
        id,
        label,
        description:
          profile?.employee_id && profile.employee_id !== label
            ? profile.employee_id
            : null,
      });
    }

    leads.forEach((lead) => {
      if (!lead.assigned_agent) return;

      addPerson(
        lead.assigned_agent,
        lead.assignedAgent ??
          (lead.created_by === lead.assigned_agent ? lead.creator : null)
      );
    });

    const leadPartnerCodes = new Set(
      leads.map((lead) => lead.partner_code).filter(Boolean)
    );

    channelPartners.forEach((partner) => {
      if (partner.partner_code && leadPartnerCodes.has(partner.partner_code)) {
        addPerson(partner.id, partner);
      }
    });

    return Array.from(people.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [leads, channelPartners]);

  // Channels are the fixed standard list only. Channel Partner codes
  // (e.g. FCS-CHP-037) stored in channel_name are people, and belong
  // in the Agent filter above.
  const uniqueChannels = CHANNEL_OPTIONS;

  const isSearchMode = search.trim().length > 0;

  // A Custom range with a bad date must never fall back to "all time".
  const customError =
    period === "custom"
      ? validateCustomRange({
          from: customFrom,
          to: customTo,
        })
      : null;

  const periodLabel = getPeriodLabel(
    period,
    customFrom,
    customTo
  );

  const finalLeads = useMemo(() => {
    if (isSearchMode) {
      return globalSearch(leads, search);
    }

    if (customError) return [];

    return applyNormalFilters(
      leads,
      {
        period,
        periodFrom: customFrom,
        periodTo: customTo,
        status,
        fuel,
        campaign,
        agent,
        channel: channelName,
      },
      todayStartIST,
      partnerIdByCode
    );
  }, [
    leads,
    isSearchMode,
    customError,
    customFrom,
    customTo,
    search,
    period,
    status,
    fuel,
    campaign,
    agent,
    channelName,
    todayStartIST,
    partnerIdByCode,
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

          {!isSearchMode && customError && (
            <div className="mt-2 text-sm font-medium text-red-600">
              {customError}
            </div>
          )}

          {!isSearchMode && periodLabel && (
            <div className="mt-2 text-sm text-slate-500">
              Showing:
              <span className="ml-2 rounded-md bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                {periodLabel}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <DashboardPeriodTabs
            period={period}
            from={customFrom}
            to={customTo}
            onSelectPeriod={setPeriod}
            onApplyCustom={(from, to) => {
              setCustomFrom(from);
              setCustomTo(to);
              setPeriod("custom");
            }}
          />

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
        period={period}
        periodFrom={customFrom}
        periodTo={customTo}
        searchResultIds={
          isSearchMode ? finalLeads.map((lead) => lead.id) : null
        }
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
