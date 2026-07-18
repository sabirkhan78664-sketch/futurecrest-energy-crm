import { supabase } from "./supabase";

export async function getDashboardStats() {

  const { count: totalLeads } =
    await supabase
      .from("leads")
      .select("*", {
        count: "exact",
        head: true,
      });

  const { count: newLeads } =
    await supabase
      .from("leads")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "New");

  const { count: assignedLeads } =
    await supabase
      .from("leads")
      .select("*", {
        count: "exact",
        head: true,
      })
      .not("assigned_agent", "is", null);

  const { count: unassignedLeads } =
    await supabase
      .from("leads")
      .select("*", {
        count: "exact",
        head: true,
      })
      .is("assigned_agent", null);

  const { count: sales } =
    await supabase
      .from("leads")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "Sale");

  const today = new Date().toISOString().split("T")[0];

  const { count: callbacksToday } =
    await supabase
      .from("leads")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("callback_date", today);

  const { data: recentLeads } = await supabase
  .from("leads")
  .select(`
    id,
    lead_id,
    customer_name,
    status,
    created_at,
    agent:profiles!leads_assigned_agent_fkey(
      employee_id,
      full_name
    )
  `)
  .order("created_at", { ascending: false })
  .limit(10);

  const formattedRecentLeads =
  (recentLeads ?? []).map((lead) => ({
    ...lead,
    agent: Array.isArray(lead.agent)
      ? lead.agent[0] ?? null
      : lead.agent,
  }));

return {
  totalLeads: totalLeads ?? 0,
  newLeads: newLeads ?? 0,
  assignedLeads: assignedLeads ?? 0,
  unassignedLeads: unassignedLeads ?? 0,
  sales: sales ?? 0,
  callbacksToday: callbacksToday ?? 0,
  recentLeads: formattedRecentLeads,
};
}