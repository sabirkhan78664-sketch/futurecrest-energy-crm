import { supabase } from "./supabase";

export async function getFollowUps(leadId: number) {
  const { data, error } = await supabase
    .from("follow_ups")
    .select("*")
    .eq("lead_id", leadId)
    .order("followup_date", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function addFollowUp(values: any) {
  const { error } = await supabase
    .from("follow_ups")
    .insert(values);

  if (error) {
    console.error(error);
    throw error;
  }

  return true;
}

export async function completeFollowUp(id: number) {
  const { error } = await supabase
    .from("follow_ups")
    .update({
      status: "Completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }

  return true;
}