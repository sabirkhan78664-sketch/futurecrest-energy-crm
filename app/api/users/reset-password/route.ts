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
          message: "Access denied. Only Super Admin can reset passwords.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const { id, password } = body;

    if (!id || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const { error } = await adminSupabase.auth.admin.updateUserById(id, {
      password,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully.",
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