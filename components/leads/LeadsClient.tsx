"use client";

import { useMemo, useState } from "react";
import LeadToolbar from "./LeadToolbar";
import LeadTable from "./LeadTable";
import LeadsRealtimeRefresher from "./LeadsRealtimeRefresher";

interface Lead {
  id: number;
  lead_id: string;
  customer_name: string;
  mobile: string;
  nmi: string | null;
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

  created_at: string | null;
}

interface Props {
  leads: Lead[];
  mode?: "leads" | "pending";
}

export default function LeadsClient({
  leads,
  mode = "leads",
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fuel, setFuel] = useState("");
  const [agent, setAgent] = useState("");
  const [campaign, setCampaign] = useState("");

  const uniqueAgents = useMemo(() => {
    return Array.from(
      new Set(
        leads
          .map((lead) => lead.assigned_agent)
          .filter(Boolean)
      )
    ) as string[];
  }, [leads]);

  const uniqueCampaigns = useMemo(() => {
    return Array.from(
      new Set(
        leads
          .map((lead) => lead.campaign)
          .filter(Boolean)
      )
    ) as string[];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        lead.lead_id?.toLowerCase().includes(searchValue) ||
        lead.customer_name?.toLowerCase().includes(searchValue) ||
        lead.mobile?.toLowerCase().includes(searchValue) ||
        lead.nmi?.toLowerCase().includes(searchValue) ||
        lead.current_retailer?.toLowerCase().includes(searchValue) ||
        lead.offered_retailer?.toLowerCase().includes(searchValue) ||
        lead.campaign?.toLowerCase().includes(searchValue) ||
        lead.assigned_agent?.toLowerCase().includes(searchValue) ||
        lead.status?.toLowerCase().includes(searchValue);

      const matchesStatus = !status || lead.status === status;
      const matchesFuel = !fuel || lead.fuel_type === fuel;
      const matchesAgent = !agent || lead.assigned_agent === agent;
      const matchesCampaign = !campaign || lead.campaign === campaign;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFuel &&
        matchesAgent &&
        matchesCampaign
      );
    });
  }, [leads, search, status, fuel, agent, campaign]);

  return (
    <>
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
        uniqueAgents={uniqueAgents}
        uniqueCampaigns={uniqueCampaigns}
      />

      <LeadTable
  leads={filteredLeads}
  mode={mode}
/>
    </>
  );
}