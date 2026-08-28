import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function profile(){ const s=await createSupabaseServerClient(); const {data:{user}}=await s.auth.getUser(); if(!user)return null; const {data}=await adminSupabase.from("profiles").select("*").eq("id",user.id).single(); return data; }
export async function DELETE(_:NextRequest,{params}:{params:Promise<{id:string}>}){ const p=await profile(); if(!p)return NextResponse.json({message:"Unauthorized"},{status:401}); if(!["Admin","Super Admin"].includes(p.role))return NextResponse.json({message:"Only Admin can delete groups"},{status:403}); const {id}=await params; const {error}=await adminSupabase.from("crm_chat_groups").delete().eq("id",id); if(error)return NextResponse.json({message:error.message},{status:400}); return NextResponse.json({success:true}); }
