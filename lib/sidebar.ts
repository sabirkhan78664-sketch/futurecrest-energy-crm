import { createSupabaseServerClient } from "./supabase-server";

export async function getSidebarStats(profile: any) {
  const supabase = await createSupabaseServerClient();

  const isAgent = profile.role === "Agent";

  let pendingQuery = supabase
    .from("leads")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("approval_status", "Pending");

  if (isAgent) {
    pendingQuery = pendingQuery.eq("assigned_agent", profile.id);
  }

  const { count: pendingApproval } = await pendingQuery;

  return {
    pendingApproval: pendingApproval ?? 0,

    // Future features
    unreadMessages: 0,
    followUpsToday: 0,
  };
}