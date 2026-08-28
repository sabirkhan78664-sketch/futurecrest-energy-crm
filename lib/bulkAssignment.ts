import { createSupabaseServerClient } from "./supabase-server";
import { addHistory } from "./history";

export async function bulkAssignLeads(leadIds: (string | number)[], agentId: string) {
  const supabase = await createSupabaseServerClient();

  // 1. Authenticated User Check
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  // 2. Fetch Agent Profile Name for History
  const { data: agentProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", agentId)
    .single();

  const agentName = agentProfile?.full_name ?? "Selected Agent";

  // 3. Fetch Admin/Manager Profile Name
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const adminName = adminProfile?.full_name ?? user.email ?? "Admin";

  // 4. Perform Bulk Update on Leads
  const { error: updateError } = await supabase
    .from("leads")
    .update({
      assigned_agent: agentId,
      assigned_by: user.id,
      assigned_at: new Date().toISOString(),
      assignment_status: "Assigned",
    })
    .in("id", leadIds);

  if (updateError) throw updateError;

  // 5. Log History Entries for Each Lead
  for (const leadId of leadIds) {
    const numericId = typeof leadId === "string" ? parseInt(leadId, 10) || 0 : leadId;
    await addHistory({
      leadId: numericId,
      action: "Bulk Lead Assignment",
      actionBy: user.id,
      actionByName: adminName,
      oldValue: "Unassigned Pool",
      newValue: agentName,
      notes: `Bulk assigned to ${agentName}`,
    });
  }

  return true;
}