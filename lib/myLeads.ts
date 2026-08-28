import { adminSupabase } from "./admin";
import { createSupabaseServerClient } from "./supabase-server";

export async function getMyLeads() {
  const auth = await createSupabaseServerClient();
  const { data: { user } } = await auth.auth.getUser();

  if (!user) return [];

  const { data: profile } = await auth
    .from("profiles")
    .select("role, partner_code")
    .eq("id", user.id)
    .single();

  // Channel Partner accounts never create or get assigned leads inside the
  // CRM — their leads arrive anonymously through the public partner submit
  // link (created_by/assigned_agent are always null there) and are tagged
  // by the lead's own partner_code, matched against the partner's code.
  // (channel_name looks similar but is a separate free-text field Closers
  // overwrite on the sales outcome form — not safe to match against.)
  if (profile?.role === "Channel Partner") {
    if (!profile.partner_code) return [];

    const { data, error } = await adminSupabase
      .from("leads")
      .select("*")
      .eq("partner_code", profile.partner_code)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getMyLeads (partner) error:", error);
      return [];
    }

    return data ?? [];
  }

  // Use the authenticated user's id and the service-role client for this
  // server-side Agent view so older rows are not hidden by RLS.
  // The Agent can only receive their own rows: assigned_agent OR created_by.
  const { data, error } = await adminSupabase
    .from("leads")
    .select("*")
    .or(`assigned_agent.eq.${user.id},created_by.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMyLeads error:", error);
    return [];
  }

  return data ?? [];
}
