import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { getCurrentUserProfile } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    if (!["Admin", "Super Admin"].includes(profile.role)) {
      return NextResponse.json(
        { success: false, message: "Only Admin or Super Admin can edit leads." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const leadId = Number(id);

    if (!Number.isInteger(leadId)) {
      return NextResponse.json({ success: false, message: "Invalid lead ID." }, { status: 400 });
    }

    const body = await request.json();

    // Never allow the edit form to change system-controlled fields.
    for (const key of [
      "id",
      "lead_id",
      "created_at",
      "created_by",
      "approval_status",
      "assignment_status",
      "qa_status",
    ]) {
      delete body[key];
    }

    const { data, error } = await adminSupabase
      .from("leads")
      .update(body)
      .eq("id", leadId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Unable to update lead." },
      { status: 500 }
    );
  }
}
