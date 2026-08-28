import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------
    // CHECK CURRENT LOGGED-IN USER
    // ---------------------------------------
    const supabase = await createSupabaseServerClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------
    // CHECK CURRENT USER ROLE
    // ---------------------------------------
    const { data: currentProfile, error: profileCheckError } =
      await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", currentUser.id)
        .single();

    if (profileCheckError || !currentProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Current user profile not found.",
        },
        { status: 403 }
      );
    }

    if (
      currentProfile.role !== "Admin" &&
      currentProfile.role !== "Super Admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Only Admin or Super Admin can update settings.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const { data: existing } = await adminSupabase
      .from("crm_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await adminSupabase
        .from("crm_settings")
        .update({
          company_name: body.company_name,
          company_email: body.company_email,
          company_phone: body.company_phone,
          website: body.website,
          crm_name: body.crm_name,
          lead_prefix: body.lead_prefix,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await adminSupabase
        .from("crm_settings")
        .insert({
          company_name: body.company_name,
          company_email: body.company_email,
          company_phone: body.company_phone,
          website: body.website,
          crm_name: body.crm_name,
          lead_prefix: body.lead_prefix,
        });

      if (error) throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message,
      },
      {
        status: 500,
      }
    );
  }
}