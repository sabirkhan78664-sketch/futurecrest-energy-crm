import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (profile.role !== "Closer") {
      return NextResponse.json(
        { success: false, message: "Closer access required" },
        { status: 403 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          message: "SUPABASE_SERVICE_ROLE_KEY is not configured",
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
      .select("id, status, approval_status, assigned_closer")
      .eq("assigned_closer", profile.id)
      .eq("approval_status", "Approved");

    if (error) {
      console.error("CLOSER DASHBOARD QUERY ERROR:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    const allLeads = leads ?? [];

    const sold = allLeads.filter(
      (lead) => lead.status === "Sold"
    ).length;

    const callback = allLeads.filter(
      (lead) => lead.status === "Callback"
    ).length;

    const lost = allLeads.filter(
      (lead) => lead.status === "Lost"
    ).length;

    const activeLeads = allLeads.filter(
      (lead) =>
        lead.status !== "Sold" &&
        lead.status !== "Lost"
    );

    const assigned = activeLeads.length;

    const ready = activeLeads.filter(
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
    console.error("CLOSER DASHBOARD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load dashboard",
      },
      { status: 500 }
    );
  }
}