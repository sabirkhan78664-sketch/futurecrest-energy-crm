import { supabase } from "./supabase";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "Admin" | "Supervisor" | "Agent" | "Closer";
  status: "Active" | "Inactive";
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("USER:", user);
  console.log("AUTH ERROR:", authError);

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id);

  console.log("PROFILE DATA:", data);
  console.log("PROFILE ERROR:", error);

  if (error) return null;

  return data?.[0] ?? null;
}


export async function getAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name");

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function updateUserRole(
  id: string,
  role: "Admin" | "Supervisor" | "Agent" | "Closer"
) {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);

  if (error) throw error;

  return true;
}

export async function updateUserStatus(
  id: string,
  status: "Active" | "Inactive"
) {
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", id);

  if (error) throw error;

  return true;
}