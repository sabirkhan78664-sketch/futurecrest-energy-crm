import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
async function me(){const s=await createSupabaseServerClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;const {data}=await adminSupabase.from("profiles").select("*").eq("id",user.id).single();return data;}
async function allowed(group_id:string,user_id:string){const {data}=await adminSupabase.from("crm_chat_group_members").select("group_id").eq("group_id",group_id).eq("user_id",user_id).maybeSingle();return !!data;}
export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const p = await me();
  if (!p) return NextResponse.json({message:"Unauthorized"},{status:401});
  const {id} = await params;
  if (!(await allowed(id,p.id))) return NextResponse.json({message:"Forbidden"},{status:403});

  const {data: members} = await adminSupabase
    .from("crm_chat_group_members")
    .select("user_id")
    .eq("group_id", id);

  const memberIds = (members || []).map((m:any) => m.user_id);

  const {data,error} = await adminSupabase
    .from("crm_messages")
    .select("*")
    .eq("group_id",id)
    .order("created_at",{ascending:true});

  if(error) return NextResponse.json({message:error.message},{status:400});

  const rows = data || [];
  // Opening a group marks messages from other members as read by this user.
  for (const row of rows) {
    if (row.sender_id === p.id) continue;
    const current = Array.isArray(row.read_by) ? row.read_by : [];
    if (!current.includes(p.id)) {
      await adminSupabase
        .from("crm_messages")
        .update({ read_by: [...current, p.id] })
        .eq("id", row.id);
      row.read_by = [...current, p.id];
    }
  }

  return NextResponse.json({messages:rows, member_ids:memberIds});
}

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const p=await me();
  if(!p) return NextResponse.json({message:"Unauthorized"},{status:401});
  const {id}=await params;
  if(!(await allowed(id,p.id))) return NextResponse.json({message:"Forbidden"},{status:403});
  const body=await req.json();
  const text=String(body.message||"").trim();
  if(!text && !body.attachment_url) return NextResponse.json({message:"Message is empty"},{status:400});
  const replyToId=body.reply_to_id ?? null;
  const mentionedIds=Array.isArray(body.mentioned_ids) ? body.mentioned_ids : [];

  const {data,error}=await adminSupabase
    .from("crm_messages")
    .insert({
      sender_id:p.id,
      receiver_id:p.id,
      group_id:id,
      message:text,
      attachment_url:body.attachment_url||null,
      is_read:true,
      read_by:[p.id],
      is_pinned:false,
      edited_at:null,
      reply_to_id:replyToId,
      mentioned_ids:mentionedIds
    })
    .select()
    .single();

  if(error) return NextResponse.json({message:error.message},{status:400});
  return NextResponse.json({message:data});
}
