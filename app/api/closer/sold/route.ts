import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { getCurrentUserProfile } from "@/lib/auth";

export async function GET() {
  try {
    // Get logged-in closer
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    if (profile.role !== "Closer") {
      return NextResponse.json(
        {
          success: false,
          message: "Only closers can access sold leads.",
        },
        { status: 403 }
      );
    }

    const closerId = profile.id;

    console.log("=================================");
    console.log("CLOSER SOLD LEADS");
    console.log("Closer:", profile.full_name);
    console.log("Closer ID:", closerId);
    console.log("=================================");

    // Get sold leads belonging to this closer
    const { data: leads, error } = await adminSupabase
      .from("leads")
      .select(`
        id,
        lead_id,
        customer_name,
        mobile,
        fuel_type,
        current_retailer,
        offered_retailer,
        status,
        comments,
        closed_at
      `)
      .eq("assigned_closer", closerId)
      .eq("status", "Sold")
      .order("closed_at", { ascending: false });

    if (error) {
      console.error("Sold leads database error:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    console.log("Sold leads found:", leads?.length || 0);

    return NextResponse.json({
      success: true,
      leads: leads || [],
      count: leads?.length || 0,
      closer: {
        id: profile.id,
        full_name: profile.full_name,
        employee_id: profile.employee_id,
      },
    });
  } catch (error: any) {
    console.error("Closer sold API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Server error.",
      },
      { status: 500 }
    );
  }
}