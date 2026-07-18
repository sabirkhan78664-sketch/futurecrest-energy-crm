import { supabase } from "./supabase";

export async function addHistory({
  leadId,
  action,
  actionBy,
  actionByName,
  oldValue,
  newValue,
  notes,
}: {
  leadId: number;
  action: string;
  actionBy?: string;
  actionByName?: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
}) {
  const { error } = await supabase
    .from("lead_history")
    .insert([
      {
        lead_id: leadId,
        action,
        action_by: actionBy,
        action_by_name: actionByName,
        old_value: oldValue,
        new_value: newValue,
        notes,
      },
    ]);

  if (error) {
    console.log("Code:", error.code);
    console.log("Message:", error.message);
    console.log("Details:", error.details);
    console.log("Hint:", error.hint);
    throw error;
  }
}

export async function getLeadHistory(leadId: number) {
  const { data, error } = await supabase
    .from("lead_history")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function logStatusChange(
  leadId: number,
  oldStatus: string,
  newStatus: string,
  userName: string
) {
  return addHistory({
    leadId,
    action: "Status Changed",
    actionByName: userName,
    oldValue: oldStatus,
    newValue: newStatus,
  });
}