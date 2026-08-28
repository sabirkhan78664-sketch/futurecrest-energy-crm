import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function me() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await adminSupabase.from("profiles").select("*").eq("id", user.id).single();
  return profile;
}

export async function GET() {
  const profile = await me();
  if (!profile) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { data: memberships, error } = await adminSupabase.from("crm_chat_group_members").select("group_id").eq("user_id", profile.id);
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  const ids = (memberships || []).map((x:any)=>x.group_id);
  if (!ids.length) return NextResponse.json({ groups: [] });
  const { data: groups, error: gErr } = await adminSupabase.from("crm_chat_groups").select("*").in("id", ids).order("created_at", { ascending: false });
  if (gErr) return NextResponse.json({ message: gErr.message }, { status: 400 });
  const counts = await Promise.all((groups || []).map(async (g:any)=>{ const { count } = await adminSupabase.from("crm_chat_group_members").select("*", { count:"exact", head:true }).eq("group_id", g.id); return { ...g, member_count: count || 0 }; }));
  return NextResponse.json({ groups: counts });
}

export async function POST(req: NextRequest) {
  const profile = await me();
  if (!profile) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!["Admin", "Super Admin"].includes(profile.role)) return NextResponse.json({ message: "Only Admin can create groups" }, { status: 403 });
  const body = await req.json();
  const name = String(body.name || "").trim();
  const member_ids = Array.isArray(body.member_ids) ? body.member_ids : [];
  if (!name) return NextResponse.json({ message: "Group name is required" }, { status: 400 });
  const { data: group, error } = await adminSupabase.from("crm_chat_groups").insert({ name, created_by: profile.id }).select().single();
  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  const ids = Array.from(new Set([profile.id, ...member_ids]));
  const rows = ids.map((user_id:string)=>({ group_id: group.id, user_id }));
  const { error: mErr } = await adminSupabase.from("crm_chat_group_members").insert(rows);
  if (mErr) { await adminSupabase.from("crm_chat_groups").delete().eq("id", group.id); return NextResponse.json({ message: mErr.message }, { status: 400 }); }
  return NextResponse.json({ group: { ...group, member_count: ids.length } });
}
