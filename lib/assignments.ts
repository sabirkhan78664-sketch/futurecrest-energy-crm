import { supabase } from "./supabase";
import { addHistory } from "./history";

export async function assignLead(
  leadId: number,
  agentId: string
) {
  // Logged in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You are not logged in.");
  }

  // Current lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    console.error(leadError);
    throw new Error("Lead not found.");
  }

  // Agent from profiles table
  const { data: agent, error: agentError } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      employee_id,
      username
    `)
    .eq("id", agentId)
    .maybeSingle();

  console.log("Selected Agent ID:", agentId);
console.log("Agent Query Result:", agent);
console.log("Agent Query Error:", agentError);

if (agentError) {
  throw new Error(
    JSON.stringify(agentError, null, 2)
  );
}

if (!agent) {
  throw new Error(
    "Agent not found. Selected ID: " + agentId
  );
}

  // Update lead
  const { error: updateError } = await supabase
    .from("leads")
    .update({
      assigned_agent: agent.id,
      assigned_by: user.id,
      assigned_at: new Date().toISOString(),
      assignment_status: "Assigned",
    })
    .eq("id", leadId);

  if (updateError) {
    console.error(updateError);
    throw updateError;
  }

  // Save history
  await addHistory({
    leadId,
    action: lead.assigned_agent
      ? "Agent Reassigned"
      : "Agent Assigned",
    actionBy: user.id,
    actionByName:
      user.user_metadata?.full_name ??
      user.email ??
      "System",
    oldValue: lead.assigned_agent ?? "",
    newValue: agent.full_name,
    notes: `Assigned to ${agent.employee_id} • ${agent.full_name}`,
  });

  return true;
}