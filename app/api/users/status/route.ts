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

    if (currentProfile.role !== "Super Admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Only Super Admin can change user status.",
        },
        { status: 403 }
      );
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "User ID and status are required." },
        { status: 400 }
      );
    }

    const allowed = ["Active", "Suspended", "Inactive"];

    if (!allowed.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status." },
        { status: 400 }
      );
    }

    const { error } = await adminSupabase
      .from("profiles")
      .update({ status })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User status updated successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Internal server error.",
      },
      { status: 500 }
    );
  }
}