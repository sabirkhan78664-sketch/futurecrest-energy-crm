import { supabase } from "./supabase";

export async function addLead(lead: any) {
  const { data, error } = await supabase
    .from("leads")
    .insert([lead])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateLead(id: number, lead: any) {
  const { data, error } = await supabase
    .from("leads")
    .update(lead)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteLead(id: number) {
  const res = await fetch(`/api/leads/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete lead");
  }

  return await res.json();
}

export async function getAgentLeads(agentId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("assigned_agent", agentId);

  if (error) throw error;

  return data ?? [];
}