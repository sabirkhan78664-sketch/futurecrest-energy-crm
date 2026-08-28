import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (profile.role !== "Closer") {
      return NextResponse.json(
        {
          success: false,
          message: "Closer access required",
        },
        { status: 403 }
      );
    }

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "SUPABASE_SERVICE_ROLE_KEY is not configured",
        },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: leads, error } = await supabaseAdmin
      .from("leads")
      .select(
        "id, status, approval_status, assigned_closer"
      )
      .eq("assigned_closer", profile.id)
      .eq("approval_status", "Approved");

    if (error) {
      console.error(
        "CLOSER DASHBOARD QUERY ERROR:",
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

    const allLeads = leads ?? [];

    /*
     * ASSIGNED
     *
     * Total number of approved leads assigned
     * to this Closer.
     */
    const assigned = allLeads.length;

    /*
     * SOLD
     */
    const sold = allLeads.filter(
      (lead) => lead.status === "Sold"
    ).length;

    /*
     * CALLBACK
     */
    const callback = allLeads.filter(
      (lead) => lead.status === "Callback"
    ).length;

    /*
     * LOST
     */
    const lost = allLeads.filter(
      (lead) => lead.status === "Lost"
    ).length;

    /*
     * READY
     *
     * Leads that are ready for the Closer
     * to process for the first time.
     *
     * Callback is deliberately NOT included here.
     */
    const ready = allLeads.filter(
      (lead) =>
        lead.status === "Assigned" ||
        lead.status === "Ready" ||
        lead.status === "New"
    ).length;

    return NextResponse.json({
      success: true,

      counts: {
        assigned,
        ready,
        sold,
        callback,
        lost,
      },
    });
  } catch (error) {
    console.error(
      "CLOSER DASHBOARD ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard",
      },
      { status: 500 }
    );
  }
}