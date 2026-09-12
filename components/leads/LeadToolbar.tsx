"use client";

import Link from "next/link";
import { RefreshCw, Plus, Download } from "lucide-react";
import MultiSelectFilter from "./MultiSelectFilter";

const STATUS_OPTIONS = [
  { value: "New", label: "New" },
  { value: "Follow-up", label: "Follow-up" },
  { value: "Interested", label: "Not Interested" },
  { value: "Processing", label: "Processing" },
  { value: "Sold", label: "Sold" },
  { value: "Lost", label: "Lost" },
  { value: "No Answer", label: "No Answer" },
  { value: "Internal DNC", label: "Internal DNC" },
  { value: "NGTG", label: "NGTG" },
  { value: "Rejected", label: "Rejected" },
];

const FUEL_OPTIONS = [
  { value: "Single", label: "Single" },
  { value: "Gas", label: "Gas" },
  { value: "Dual", label: "Dual" },
];

const FORM_OPTIONS = [
  { value: "Energy", label: "Energy" },
  { value: "PHI", label: "PHI" },
  { value: "NBN", label: "NBN" },
];

interface Props {
  search: string;
  setSearch: (value: string) => void;

  status: string[];
  setStatus: (value: string[]) => void;

  fuel: string[];
  setFuel: (value: string[]) => void;

  agent: string[];
  setAgent: (value: string[]) => void;

  campaign: string[];
  setCampaign: (value: string[]) => void;

  channelName: string[];
  setChannelName: (value: string[]) => void;

  setPeriod: (value: string) => void;

  uniqueAgents: { id: string; label: string }[];
  uniqueChannels: string[];
}

export default function LeadToolbar({
  search,
  setSearch,
  status,
  setStatus,
  fuel,
  setFuel,
  agent,
  setAgent,
  campaign,
  setCampaign,
  channelName,
  setChannelName,
  setPeriod,
  uniqueAgents,
  uniqueChannels,
}: Props) {
  function resetFilters() {
    setSearch("");
    setStatus([]);
    setFuel([]);
    setAgent([]);
    setCampaign([]);
    setChannelName([]);
    setPeriod("today");
  }

  const exportParams = new URLSearchParams();
  campaign.forEach((value) => exportParams.append("campaign", value));
  status.forEach((value) => exportParams.append("status", value));
  const exportHref = `/api/leads/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  const agentOptions = uniqueAgents.map((item) => ({
    value: item.id,
    label: item.label,
  }));

  const channelOptions = uniqueChannels.map((item) => ({
    value: item,
    label: item,
  }));

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="grid grid-cols-1 gap-4 md:grid-cols-7">

        <input
          className="rounded-xl border border-slate-300 p-3 md:col-span-2"
          placeholder="Search Lead ID, Customer, Mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <MultiSelectFilter
          label="All Status"
          options={STATUS_OPTIONS}
          selected={status}
          onChange={setStatus}
        />

        <MultiSelectFilter
          label="All Fuel"
          options={FUEL_OPTIONS}
          selected={fuel}
          onChange={setFuel}
        />

        <MultiSelectFilter
          label="All Forms"
          options={FORM_OPTIONS}
          selected={campaign}
          onChange={setCampaign}
        />

        <MultiSelectFilter
          label="All Agents"
          options={agentOptions}
          selected={agent}
          onChange={setAgent}
        />

        <MultiSelectFilter
          label="All Channels"
          options={channelOptions}
          selected={channelName}
          onChange={setChannelName}
        />

      </div>

      <div className="mt-5 flex items-center justify-between">

        <button
          onClick={resetFilters}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          Reset Filters
        </button>

        <div className="flex gap-3">

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <a
            href={exportHref}
            download
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Download size={16} />
            Export CSV
          </a>

          <Link
            href="/leads/new"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={16} />
            New Lead
          </Link>

        </div>

      </div>

    </div>
  );
}
