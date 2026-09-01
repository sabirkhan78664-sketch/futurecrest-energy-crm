import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { getCurrentUserProfile } from "@/lib/auth";

export async function GET() {
  try {
    // --------------------------------------------------
    // 1. GET CURRENT USER
    // --------------------------------------------------

    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "User not authenticated.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. ONLY CLOSERS CAN ACCESS THIS API
    // --------------------------------------------------

    if (profile.role !== "Closer") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only closers can access assigned sales.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // 3. CLOSER UUID
    // --------------------------------------------------

    const closerId = profile.id;

    console.log("=================================");
    console.log("CLOSER SALES API");
    console.log("Closer:", profile.full_name);
    console.log("Closer ID:", closerId);
    console.log("Employee ID:", profile.employee_id);
    console.log("=================================");

    if (!closerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Closer ID not found.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. LOAD ALL LEADS ASSIGNED TO CLOSER
    // --------------------------------------------------
    //
    // IMPORTANT:
    // Do NOT require lead_id to be non-null.
    //
    // Some valid leads may have lead_id = null.
    // The UI can safely fall back to the database id.
    //
    // No approval gate — a lead claimed via Take Lead shows up here
    // immediately, regardless of approval_status.
    // --------------------------------------------------

    const { data: leads, error } = await adminSupabase
      .from("leads")
      .select("*")
      .eq("assigned_closer", closerId)
      .order("assigned_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "CLOSER SALES DATABASE ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    const allLeads = leads || [];

    console.log(
      "Assigned leads found:",
      allLeads.length
    );

    // --------------------------------------------------
    // 5. DEBUG STATUS BREAKDOWN
    // --------------------------------------------------

    const statusBreakdown = {
      assigned: allLeads.filter(
        (lead) =>
          lead.status === "Assigned"
      ).length,

      ready: allLeads.filter(
        (lead) =>
          lead.status === "Ready"
      ).length,

      new: allLeads.filter(
        (lead) =>
          lead.status === "New"
      ).length,

      followup: allLeads.filter(
        (lead) =>
          lead.status === "Follow-up"
      ).length,

      sold: allLeads.filter(
        (lead) =>
          lead.status === "Sold"
      ).length,

      lost: allLeads.filter(
        (lead) =>
          lead.status === "Lost"
      ).length,
    };

    console.log(
      "CLOSER SALES STATUS BREAKDOWN:",
      statusBreakdown
    );

    // --------------------------------------------------
    // 6. RETURN LEADS
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      leads: allLeads,

      count: allLeads.length,

      closer: {
        id: profile.id,
        full_name: profile.full_name,
        employee_id: profile.employee_id,
      },
    });
  } catch (error: any) {
    console.error(
      "CLOSER SALES API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to load closer sales.",
      },
      { status: 500 }
    );
  }
}