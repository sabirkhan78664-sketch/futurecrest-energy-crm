import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
async function admin(){const s=await createSupabaseServerClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;const {data}=await adminSupabase.from("profiles").select("*").eq("id",user.id).single();return data&&["Admin","Super Admin"].includes(data.role)?data:null;}
async function me(){const s=await createSupabaseServerClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;const {data}=await adminSupabase.from("profiles").select("*").eq("id",user.id).single();return data;}
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const p=await me();
  if(!p)return NextResponse.json({message:"Unauthorized"},{status:401});
  const {id}=await params;
  const body=await req.json();
  const emoji=String(body.emoji||"");
  if(!emoji)return NextResponse.json({message:"emoji is required"},{status:400});
  const {data:existing,error:fetchError}=await adminSupabase.from("crm_messages").select("reactions").eq("id",id).maybeSingle();
  if(fetchError)return NextResponse.json({message:fetchError.message},{status:400});
  if(!existing)return NextResponse.json({message:"Message not found"},{status:404});
  const reactions:Record<string,string[]> = existing.reactions && typeof existing.reactions==="object" ? existing.reactions : {};
  const current = Array.isArray(reactions[emoji]) ? reactions[emoji] : [];
  const updated:Record<string,string[]> = {...reactions};
  if(current.includes(p.id)){
    const filtered = current.filter((uid:string)=>uid!==p.id);
    if(filtered.length) updated[emoji]=filtered; else delete updated[emoji];
  } else {
    updated[emoji]=[...current,p.id];
  }
  const {error}=await adminSupabase.from("crm_messages").update({reactions:updated}).eq("id",id);
  if(error)return NextResponse.json({message:error.message},{status:400});
  return NextResponse.json({success:true,reactions:updated});
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){if(!(await admin()))return NextResponse.json({message:"Only Admin can edit messages"},{status:403});const {id}=await params;const body=await req.json();const {error}=await adminSupabase.from("crm_messages").update({
  message:String(body.message||""),
  edited_at:new Date().toISOString()
}).eq("id",id);if(error)return NextResponse.json({message:error.message},{status:400});return NextResponse.json({success:true});}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  if(!(await admin())) return NextResponse.json({message:"Only Admin can manage messages"},{status:403});
  const {id}=await params;
  const body=await req.json();
  if(typeof body.is_pinned !== "boolean") return NextResponse.json({message:"is_pinned must be boolean"},{status:400});
  const {error}=await adminSupabase.from("crm_messages").update({is_pinned:body.is_pinned}).eq("id",id);
  if(error)return NextResponse.json({message:error.message},{status:400});
  return NextResponse.json({success:true});
}

export async function DELETE(_:NextRequest,{params}:{params:Promise<{id:string}>}){if(!(await admin()))return NextResponse.json({message:"Only Admin can delete messages"},{status:403});const {id}=await params;const {error}=await adminSupabase.from("crm_messages").delete().eq("id",id);if(error)return NextResponse.json({message:error.message},{status:400});return NextResponse.json({success:true});}
