import { supabase } from "./supabase";

/* ===========================
   GET ALL LEADS
=========================== */
export async function getLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select(`
      *,
      agent:profiles!leads_assigned_agent_fkey(
        id,
        employee_id,
        full_name,
        username
      )
    `)
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

/* ===========================
   GET SINGLE LEAD
=========================== */
export async function getLead(id: number) {
  const { data, error } = await supabase
    .from("leads")
    .select(`
  *,
  agent:profiles!leads_assigned_agent_fkey(
    id,
    employee_id,
    full_name,
    username
  )
`)
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

/* ===========================
   ADD LEAD
=========================== */
export async function addLead(lead: any) {
  const { data, error } = await supabase
    .from("leads")
    .insert([lead])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* ===========================
   UPDATE LEAD
=========================== */
export async function updateLead(
  id: number,
  lead: any
) {
  const { data, error } = await supabase
    .from("leads")
    .update(lead)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* ===========================
   DELETE LEAD
=========================== */
export async function deleteLead(id: number) {
  const res = await fetch(`/api/leads/${id}`, {
    method: "DELETE",
  });

  const result = await res.json();

  if (!result.success) {
    throw new Error(result.message);
  }

  return true;
}
export async function getAgentLeads(
  agentId: string
) {
  const { data, error } = await supabase
    .from("leads")
    .select(`
  *,
  agent:profiles!leads_assigned_agent_fkey(
    id,
    employee_id,
    full_name,
    username
  )
`)
    .eq("assigned_agent", agentId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}