import { createSupabaseServerClient } from "./supabase-server";

export async function getSettings() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("crm_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}