"use client";

import Link from "next/link";
import { RefreshCw, Plus, Download } from "lucide-react";

interface Props {
  search: string;
  setSearch: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;

  fuel: string;
  setFuel: (value: string) => void;

  agent: string;
  setAgent: (value: string) => void;

  campaign: string;
  setCampaign: (value: string) => void;

  uniqueAgents: { id: string; label: string }[];
  uniqueCampaigns: string[];
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
  uniqueAgents,
  uniqueCampaigns,
}: Props) {
  function resetFilters() {
    setSearch("");
    setStatus("");
    setFuel("");
    setAgent("");
    setCampaign("");
  }

  const exportParams = new URLSearchParams();
  if (campaign) exportParams.set("campaign", campaign);
  if (status) exportParams.set("status", status);
  const exportHref = `/api/leads/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="grid grid-cols-1 gap-4 md:grid-cols-6">

        <input
          className="rounded-xl border border-slate-300 p-3 md:col-span-2"
          placeholder="Search Lead ID, Customer, Mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="rounded-xl border border-slate-300 p-3"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option>New</option>
          <option>Follow-up</option>
          <option>Interested</option>
          <option>Processing</option>
          <option>Sold</option>
          <option>Lost</option>
          <option>No Answer</option>
          <option>Internal DNC</option>
          <option>NGTG</option>
          <option>Rejected</option>
        </select>

        <select
          className="rounded-xl border border-slate-300 p-3"
          value={fuel}
          onChange={(e) => setFuel(e.target.value)}
        >
          <option value="">All Fuel</option>
          <option>Electricity</option>
          <option>Gas</option>
          <option>Dual Fuel</option>
        </select>

        <select
          className="rounded-xl border border-slate-300 p-3"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
        >
          <option value="">All Campaigns</option>

          {uniqueCampaigns.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="rounded-xl border border-slate-300 p-3"
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
        >
          <option value="">All Agents</option>

          {uniqueAgents.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

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