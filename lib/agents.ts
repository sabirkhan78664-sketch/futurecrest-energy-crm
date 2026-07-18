import { supabase } from "./supabase";

// =========================
// GET ALL AGENTS
// =========================

export async function getAgents() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "Agent")
    .order("employee_number", {
      ascending: true,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

// =========================
// GET ONE AGENT
// =========================

export async function getAgent(id: string) {
  console.log("Looking for agent:", id);

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  console.log("Agent:", data);
  console.log("Error:", error);

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

// =========================
// CREATE AGENT
// =========================

export async function addAgent(agent: any) {
  const { error } = await supabase
    .from("profiles")
    .insert(agent);

  if (error) throw error;

  return true;
}

// =========================
// UPDATE AGENT
// =========================

export async function updateAgent(
  id: string,
  values: any
) {
  const { error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", id);

  if (error) throw error;

  return true;
}

// =========================
// DELETE AGENT
// =========================

export async function deleteAgent(id: string) {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}

// =========================
// ACTIVE AGENTS
// =========================

export async function getActiveAgents() {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      employee_id,
      username,
      full_name
    `)
    .eq("role", "Agent")
    .eq("status", "Active")
    .order("employee_number");

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}