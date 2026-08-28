import { createSupabaseServerClient } from "./supabase-server";

export async function getDashboardStats(profile: any) {
  const supabase = await createSupabaseServerClient();

  const user = { id: profile.id };
  const isAgent = profile.role === "Agent";

  // -----------------------------
  // TOTAL LEADS
  // -----------------------------
  let totalQuery = supabase.from("leads").select("*", {
    count: "exact",
    head: true,
  });

  if (isAgent) {
    totalQuery = totalQuery.eq("assigned_agent", user.id);
  }

  const { count: totalLeads } = await totalQuery;

  // -----------------------------
  // NEW LEADS
  // -----------------------------
  let newQuery = supabase
    .from("leads")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("status", "New");

  if (isAgent) {
    newQuery = newQuery.eq("assigned_agent", user.id);
  }

  const { count: newLeads } = await newQuery;

  // -----------------------------
  // ASSIGNED LEADS
  // -----------------------------
  let assignedQuery = supabase
    .from("leads")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("status", "Assigned");

  if (isAgent) {
    assignedQuery = assignedQuery.eq("assigned_agent", user.id);
  }

  const { count: assignedLeads } = await assignedQuery;

  // -----------------------------
  // UNASSIGNED LEADS
  // -----------------------------
  let unassignedQuery = supabase
    .from("leads")
    .select("*", {
      count: "exact",
      head: true,
    })
    .is("assigned_agent", null);

  if (isAgent) {
    unassignedQuery = unassignedQuery.eq("assigned_agent", user.id);
  }

  const { count: unassignedLeads } = await unassignedQuery;

  // -----------------------------
  // SALES
  // -----------------------------
  let salesQuery = supabase
    .from("leads")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("status", "Sale");

  if (isAgent) {
    salesQuery = salesQuery.eq("assigned_agent", user.id);
  }

  const { count: sales } = await salesQuery;

  // -----------------------------
  // PENDING APPROVAL
  // -----------------------------
  let pendingQuery = supabase
    .from("leads")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("approval_status", "Pending");

  if (isAgent) {
    pendingQuery = pendingQuery.eq("assigned_agent", user.id);
  }

  const { count: pendingApproval } = await pendingQuery;

  // -----------------------------
  // REJECTED
  // -----------------------------
  let rejectedQuery = supabase
    .from("leads")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("approval_status", "Rejected");

  if (isAgent) {
    rejectedQuery = rejectedQuery.eq("assigned_agent", user.id);
  }

  const { count: rejectedLeads } = await rejectedQuery;

  // -----------------------------
  // QA PENDING
  // -----------------------------
  let qaQuery = supabase
    .from("leads")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("qa_status", "Pending");

  if (isAgent) {
    qaQuery = qaQuery.eq("assigned_agent", user.id);
  }

  const { count: qaPending } = await qaQuery;

  // -----------------------------
  // COMPLETED
  // -----------------------------
  let completedQuery = supabase
    .from("leads")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("status", "Completed");

  if (isAgent) {
    completedQuery = completedQuery.eq("assigned_agent", user.id);
  }

  const { count: completedLeads } = await completedQuery;

  // -----------------------------
  // CALLBACKS TODAY
  // -----------------------------
  const today = new Date().toISOString().split("T")[0];

  let callbackQuery = supabase
    .from("leads")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("callback_date", today);

  if (isAgent) {
    callbackQuery = callbackQuery.eq("assigned_agent", user.id);
  }

  const { count: callbacksToday } = await callbackQuery;

  // -----------------------------
  // RECENT LEADS
  // -----------------------------
  let recentQuery = supabase
    .from("leads")
    .select(
      `
      id,
      lead_id,
      customer_name,
      status,
      created_at,
      assigned_agent,
      agent:profiles!leads_assigned_agent_fkey(
        id,
        employee_id,
        full_name,
        username
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(10);

  if (isAgent) {
    recentQuery = recentQuery.eq("assigned_agent", user.id);
  }

  const { data: recentLeads, error: recentError } = await recentQuery;

  console.log("RECENT LEADS:", recentLeads);
  console.log("RECENT ERROR:", recentError);

  const formattedRecentLeads = (recentLeads ?? []).map((lead: any) => ({
    ...lead,
    agent: Array.isArray(lead.agent) ? lead.agent[0] ?? null : lead.agent,
  }));

  const statusChart = [
    {
      name: "New",
      value: newLeads ?? 0,
    },
    {
      name: "Pending",
      value: pendingApproval ?? 0,
    },
    {
      name: "Assigned",
      value: assignedLeads ?? 0,
    },
    {
      name: "Sales",
      value: sales ?? 0,
    },
    {
      name: "Rejected",
      value: rejectedLeads ?? 0,
    },
    {
      name: "Completed",
      value: completedLeads ?? 0,
    },
  ];

  // -----------------------------
  // TOP AGENT PERFORMANCE
  // -----------------------------
  let topAgentQuery = supabase.from("leads").select(`
    assigned_agent,
    agent:profiles!leads_assigned_agent_fkey(
      id,
      employee_id,
      full_name
    )
  `);

  if (isAgent) {
    topAgentQuery = topAgentQuery.eq("assigned_agent", user.id);
  }

  const { data: topAgentData } = await topAgentQuery;

  const agentMap = new Map<
    string,
    {
      employee_id: string;
      full_name: string;
      leads: number;
    }
  >();

  (topAgentData ?? []).forEach((lead: any) => {
    const agent = Array.isArray(lead.agent) ? lead.agent[0] : lead.agent;

    if (!agent) return;

    if (!agentMap.has(agent.id)) {
      agentMap.set(agent.id, {
        employee_id: agent.employee_id,
        full_name: agent.full_name,
        leads: 0,
      });
    }

    agentMap.get(agent.id)!.leads++;
  });

  const topAgents = [...agentMap.values()]
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);

  // -----------------------------
  // DAILY LEAD TREND (LAST 7 DAYS)
  // -----------------------------
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 6);

  let trendQuery = supabase
    .from("leads")
    .select("created_at");

  if (isAgent) {
    trendQuery = trendQuery.eq("assigned_agent", user.id);
  }

  trendQuery = trendQuery.gte("created_at", last7Days.toISOString());

  const { data: trendData } = await trendQuery;

  const trendMap = new Map<string, number>();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);

    const key = d.toISOString().split("T")[0];

    trendMap.set(key, 0);
  }

  (trendData ?? []).forEach((lead) => {
    const key = lead.created_at.split("T")[0];

    if (trendMap.has(key)) {
      trendMap.set(key, trendMap.get(key)! + 1);
    }
  });

  const dailyTrend = [...trendMap.entries()].map(([date, leads]) => ({
    day: new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
    }),
    leads,
  }));

  return {
    totalLeads: totalLeads ?? 0,
    newLeads: newLeads ?? 0,
    assignedLeads: assignedLeads ?? 0,
    unassignedLeads: unassignedLeads ?? 0,
    sales: sales ?? 0,

    pendingApproval: pendingApproval ?? 0,
    rejectedLeads: rejectedLeads ?? 0,
    qaPending: qaPending ?? 0,
    completedLeads: completedLeads ?? 0,

    callbacksToday: callbacksToday ?? 0,

    statusChart,
    topAgents,
    dailyTrend,
    recentLeads: formattedRecentLeads,
  };
}