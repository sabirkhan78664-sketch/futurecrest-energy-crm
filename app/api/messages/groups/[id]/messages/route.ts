import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createNotification } from "@/lib/notifications";
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

  // Last 50 messages only — this was loading a group's entire history on
  // every open and every 3s poll. Fetched newest-first so LIMIT actually
  // caps at the most recent messages, then reversed back to chat order.
  const {data,error} = await adminSupabase
    .from("crm_messages")
    .select("*")
    .eq("group_id",id)
    .order("created_at",{ascending:false})
    .limit(50);

  if(error) return NextResponse.json({message:error.message},{status:400});

  const rows = (data || []).reverse();

  // Opening a group marks messages from other members as read by this
  // user. Was a sequential await-per-row loop (N+1) over the entire
  // history; now runs in parallel and only over the capped page above.
  const rowsToMark = rows.filter((row) => {
    if (row.sender_id === p.id) return false;
    const current = Array.isArray(row.read_by) ? row.read_by : [];
    return !current.includes(p.id);
  });

  if (rowsToMark.length) {
    await Promise.all(
      rowsToMark.map(async (row) => {
        const current = Array.isArray(row.read_by) ? row.read_by : [];
        const updated = [...current, p.id];
        row.read_by = updated;
        await adminSupabase.from("crm_messages").update({ read_by: updated }).eq("id", row.id);
      })
    );
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

  try {
    const {data: members} = await adminSupabase
      .from("crm_chat_group_members")
      .select("user_id")
      .eq("group_id", id);

    const {data: group} = await adminSupabase
      .from("crm_chat_groups")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    const recipientIds = (members || [])
      .map((m: { user_id: string }) => m.user_id)
      .filter((memberId: string) => memberId !== p.id);

    const preview = text || (body.attachment_url ? "Sent an attachment" : "");

    await Promise.all(
      recipientIds.map((recipientId: string) =>
        createNotification({
          userId: recipientId,
          title: `New message in ${group?.name || "group chat"}`,
          message: `${p.full_name || p.employee_id}: ${
            preview.length > 100 ? `${preview.slice(0, 97)}...` : preview
          }`,
          type: "group_message",
          referenceId: data.id,
          url: "/messages",
        }).catch((notificationError) => {
          console.error("Group message notification error:", notificationError);
        })
      )
    );
  } catch (notificationError) {
    console.error("Group message notification error:", notificationError);
  }

  return NextResponse.json({message:data});
}
