import { adminSupabase } from "./admin";

export async function getSettings() {
  const { data, error } = await adminSupabase
    .from("crm_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}