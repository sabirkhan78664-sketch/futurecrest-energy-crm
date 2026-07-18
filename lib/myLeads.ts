import { supabase } from "./supabase";

export async function getMyLeads() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Get logged-in user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error(profileError);
    return [];
  }

  // Get leads assigned to this user
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("assigned_agent", profile.id)
    .order("assigned_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}