import { createSupabaseServerClient } from "./supabase-server";

// ==========================
// USER MANAGEMENT
// ==========================
export async function getUsers() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUsers:", error);
    return [];
  }

  return data ?? [];
}

// ==========================
// MESSAGE RECIPIENTS
// ==========================
export async function getMessageUsers() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      employee_id,
      full_name,
      role,
      status,
      can_receive_messages
    `)
    .eq("status", "Active")
    .eq("can_receive_messages", true)
    .order("full_name");

  if (error) {
    console.error("getMessageUsers:", error);
    return [];
  }

  return data ?? [];
}