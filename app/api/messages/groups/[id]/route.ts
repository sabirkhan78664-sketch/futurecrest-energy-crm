import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function profile(){ const s=await createSupabaseServerClient(); const {data:{user}}=await s.auth.getUser(); if(!user)return null; const {data}=await adminSupabase.from("profiles").select("*").eq("id",user.id).single(); return data; }
export async function DELETE(_:NextRequest,{params}:{params:Promise<{id:string}>}){ const p=await profile(); if(!p)return NextResponse.json({message:"Unauthorized"},{status:401}); if(!["Admin","Super Admin"].includes(p.role))return NextResponse.json({message:"Only Admin can delete groups"},{status:403}); const {id}=await params; const {error}=await adminSupabase.from("crm_chat_groups").delete().eq("id",id); if(error)return NextResponse.json({message:error.message},{status:400}); return NextResponse.json({success:true}); }

// Adds members to an existing group. Same permission rule as group
// creation (POST /api/messages/groups) — Admin/Super Admin only.
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const p=await profile();
  if(!p)return NextResponse.json({message:"Unauthorized"},{status:401});
  if(!["Admin","Super Admin"].includes(p.role))return NextResponse.json({message:"Only Admin can manage group members"},{status:403});
  const {id}=await params;
  const body=await req.json();
  const memberIds=Array.isArray(body.member_ids) ? body.member_ids.filter((x:unknown)=>typeof x==="string" && x) : [];
  if(!memberIds.length)return NextResponse.json({message:"member_ids is required"},{status:400});

  const {data:group}=await adminSupabase.from("crm_chat_groups").select("id").eq("id",id).maybeSingle();
  if(!group)return NextResponse.json({message:"Group not found"},{status:404});

  const {data:existing,error:existingError}=await adminSupabase.from("crm_chat_group_members").select("user_id").eq("group_id",id);
  if(existingError)return NextResponse.json({message:existingError.message},{status:400});

  const existingIds=new Set((existing||[]).map((m:{user_id:string})=>m.user_id));
  const newIds=memberIds.filter((uid:string)=>!existingIds.has(uid));

  if(newIds.length){
    const rows=newIds.map((user_id:string)=>({group_id:id,user_id}));
    const {error}=await adminSupabase.from("crm_chat_group_members").insert(rows);
    if(error)return NextResponse.json({message:error.message},{status:400});
  }

  const {count}=await adminSupabase.from("crm_chat_group_members").select("*",{count:"exact",head:true}).eq("group_id",id);

  return NextResponse.json({success:true,added:newIds.length,member_count:count||0});
}
