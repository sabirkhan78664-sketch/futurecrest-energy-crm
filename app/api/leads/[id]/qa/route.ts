import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const leadId = Number(id);

    if (!Number.isInteger(leadId)) {
      return NextResponse.json(
        { success: false, message: "Invalid lead ID." },
        { status: 400 }
      );
    }

    const authClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "Unable to verify your account." },
        { status: 401 }
      );
    }

    if (!["QA", "Admin", "Super Admin"].includes(profile.role)) {
      return NextResponse.json(
        { success: false, message: "QA access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const action = String(body.action || "");
    const notes = String(body.notes || "").trim();

    if (!["Approved", "Rejected"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action must be Approved or Rejected." },
        { status: 400 }
      );
    }

    if (action === "Rejected" && !notes) {
      return NextResponse.json(
        { success: false, message: "A rejection reason is required." },
        { status: 400 }
      );
    }

    const { data: lead, error: leadError } = await adminSupabase
      .from("leads")
      .select("id, lead_id, status, qa_status, comments")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, message: "Lead not found." },
        { status: 404 }
      );
    }

    // Post-sale QA is only valid for a Sold lead.
    if (lead.status !== "Sold") {
      return NextResponse.json(
        {
          success: false,
          message: "Post-Sale QA can only be performed on Sold leads.",
        },
        { status: 409 }
      );
    }

    // Do not silently overwrite an audit that has already been completed.
    if (lead.qa_status === "Approved" || lead.qa_status === "Rejected") {
      return NextResponse.json(
        {
          success: false,
          message: `This lead has already been QA ${lead.qa_status}.`,
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const auditNote =
      `[Post-Sale QA ${action} by ${profile.full_name || profile.role}]` +
      (notes ? `: ${notes}` : "");

    const combinedComments = [lead.comments, auditNote]
      .filter(Boolean)
      .join("\n");

    const { error: updateError } = await adminSupabase
      .from("leads")
      .update({
        qa_status: action,
        comments: combinedComments,
      })
      .eq("id", leadId)
      .eq("status", "Sold")
      .not("qa_status", "in", "(Approved,Rejected)");

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message },
        { status: 500 }
      );
    }

    await adminSupabase.from("lead_history").insert({
      lead_id: leadId,
      action: `Post-Sale QA ${action}`,
      action_by: user.id,
      action_by_name: profile.full_name || profile.role,
      old_value: lead.qa_status || "Not Audited",
      new_value: action,
      notes: notes || `Post-Sale QA marked ${action}.`,
    });

    return NextResponse.json({
      success: true,
      message: `Lead marked as QA ${action}.`,
      qa_status: action,
      audited_at: now,
    });
  } catch (error: any) {
    console.error("Post-Sale QA error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Unable to complete QA audit.",
      },
      { status: 500 }
    );
  }
}
