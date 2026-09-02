import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { adminSupabase } from "@/lib/admin";

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
| MainLayout is a client component, so it can never safely hold the
| service-role key — these two sidebar badge counts (Pending Approval,
| QA Pending) are computed here instead, the same way getPendingApprovals()
| and getDashboardMetrics() already do, so a leftover RLS policy can't
| silently zero them out for the browser client.
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    let pendingApproval = 0;
    let qaPending = 0;

    if (
      profile.role === "Admin" ||
      profile.role === "Super Admin"
    ) {
      const { count, error } = await adminSupabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("approval_status", "Pending");

      if (error) {
        console.error(
          "sidebar-stats pending approval error:",
          error
        );
      } else {
        pendingApproval = count ?? 0;
      }
    }

    if (profile.role === "QA") {
      const { count, error } = await adminSupabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "Sold")
        .not(
          "qa_status",
          "in",
          "(Approved,Rejected)"
        );

      if (error) {
        console.error(
          "sidebar-stats qa pending error:",
          error
        );
      } else {
        qaPending = count ?? 0;
      }
    }

    return NextResponse.json({
      success: true,
      pendingApproval,
      qaPending,
    });
  } catch (error) {
    console.error("sidebar-stats error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load sidebar stats.",
      },
      { status: 500 }
    );
  }
}
