import { createSupabaseServerClient } from "./supabase-server";

export async function getInboxMessages(profile: any) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("crm_message_recipients")
    .select("*");

  if (error) {
    console.log("Error object:", JSON.stringify(error, null, 2));
    throw error;
  }

  return data ?? [];
}