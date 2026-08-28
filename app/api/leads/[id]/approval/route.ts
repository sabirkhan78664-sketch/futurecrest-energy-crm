import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ============================================================
    // AUTH — verify the actual logged-in session and role. Only
    // Admin/Super Admin may approve or reject leads. Previously
    // this route trusted a client-supplied userId with no check
    // at all — anyone could approve/reject any lead.
    // ============================================================

    const supabaseAuth = await createSupabaseServerClient();

    const {
      data: { user: authUser },
    } = await supabaseAuth.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in again." },
        { status: 401 }
      );
    }

    const {
      data: authProfile,
      error: authProfileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .single();

    if (authProfileError || !authProfile) {
      return NextResponse.json(
        { error: "Unable to verify your account role." },
        { status: 401 }
      );
    }

    if (
      authProfile.role !== "Admin" &&
      authProfile.role !== "Super Admin"
    ) {
      return NextResponse.json(
        { error: "Only Admin or Super Admin can approve or reject leads." },
        { status: 403 }
      );
    }

    const verifiedUserId = authUser.id;

    // Next.js 16
    const { id } = await params;
    const leadId = Number(id);

    console.log("Route ID:", id);
    console.log("Lead ID:", leadId);

    if (isNaN(leadId)) {
      return NextResponse.json(
        { error: "Invalid Lead ID." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      action,
      closerId,
      reason,
    } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          error: "Invalid action.",
        },
        {
          status: 400,
        }
      );
    }

    const now = new Date().toISOString();

    // =========================================
    // CHECK LEAD EXISTS
    // =========================================

    const {
      data: lead,
      error: leadError,
    } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    console.log("Lead:", lead);
    console.log("Lead Error:", leadError);

    if (leadError || !lead) {
      return NextResponse.json(
        {
          error: "Lead not found.",
        },
        {
          status: 404,
        }
      );
    }

    // Already approved

    if (
      action === "approve" &&
      lead.approval_status === "Approved"
    ) {
      return NextResponse.json(
        {
          error: "Lead already approved.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================
    // APPROVE
    // =========================================

    if (action === "approve") {
      if (!closerId) {
        return NextResponse.json(
          {
            error: "Please select a closer.",
          },
          {
            status: 400,
          }
        );
      }

      const { error } = await supabase
        .from("leads")
        .update({
          approval_status: "Approved",

          approved_by: verifiedUserId,
          approved_at: now,

          assigned_closer: closerId,

          assignment_status: "Assigned",

          assigned_by: verifiedUserId,
          assigned_at: now,

          status: "Assigned",
        })
        .eq("id", leadId);

      if (error) {
        throw error;
      }

      await supabase
        .from("lead_history")
        .insert({
          lead_id: leadId,

          action: "Lead Approved",

          action_by: verifiedUserId,

          action_by_name: "Admin",

          old_value: "Pending",

          new_value: "Approved",

          notes:
            "Lead approved and assigned to closer.",
        });
    }

    // =========================================
    // REJECT
    // =========================================

    if (action === "reject") {
      if (!reason) {
        return NextResponse.json(
          {
            error:
              "Rejection reason is required.",
          },
          {
            status: 400,
          }
        );
      }

      const { error } = await supabase
        .from("leads")
        .update({
          approval_status: "Rejected",

          rejected_by: verifiedUserId,

          rejected_at: now,

          rejection_reason: reason,

          status: "Rejected",
        })
        .eq("id", leadId);

      if (error) {
        throw error;
      }

      await supabase
        .from("lead_history")
        .insert({
          lead_id: leadId,

          action: "Lead Rejected",

          action_by: verifiedUserId,

          action_by_name: "Admin",

          old_value: "Pending",

          new_value: "Rejected",

          notes: reason,
        });
    }

    return NextResponse.json({
      success: true,
    });

  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err.message ||
          "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}