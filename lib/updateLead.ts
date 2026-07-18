import { supabase } from "./supabase";

export async function updateLead(id: number, data: any) {
  const { error } = await supabase
    .from("leads")
    .update(data)
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}