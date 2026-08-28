import { adminSupabase } from "@/lib/admin";

interface TimelineEntry {
  lead_id: number;
  action: string;
  description?: string;
  performed_by?: string | null;
}

export async function addTimeline({
  lead_id,
  action,
  description,
  performed_by,
}: TimelineEntry) {
  const { error } = await adminSupabase
    .from("lead_timeline")
    .insert({
      lead_id,
      action,
      description,
      performed_by,
    });

  if (error) {
    console.error("Timeline Error:", error.message);
    throw error;
  }

  return true;
}

export async function getTimeline(lead_id: number) {
  const { data, error } = await adminSupabase
    .from("lead_timeline")
    .select("*")
    .eq("lead_id", lead_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Timeline Fetch Error:", error.message);
    return [];
  }

  return data;
}