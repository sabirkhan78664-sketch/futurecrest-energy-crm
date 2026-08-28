import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function logActivity({
  leadId,
  userId,
  activityType,
  description,
}: {
  leadId?: number;
  userId: string;
  activityType: string;
  description: string;
}) {
  const supabase = await createSupabaseServerClient();

  await supabase.from("activity_logs").insert({
    lead_id: leadId ?? null,
    user_id: userId,
    activity_type: activityType,
    description,
  });
}
export async function getRecentActivities(limit = 10) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("activity_logs")
    .select(`
      id,
      activity_type,
      description,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}