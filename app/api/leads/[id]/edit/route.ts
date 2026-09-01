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

    const isAdmin = ["Admin", "Super Admin"].includes(profile.role);

    if (!isAdmin && profile.role !== "Closer") {
      return NextResponse.json(
        { success: false, message: "Only Admin, Super Admin, or the assigned Closer can edit leads." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const leadId = Number(id);

    if (!Number.isInteger(leadId)) {
      return NextResponse.json({ success: false, message: "Invalid lead ID." }, { status: 400 });
    }

    // A Closer may only edit a lead assigned to them — Admin/Super Admin
    // keep unrestricted access to every lead.
    if (!isAdmin) {
      const { data: existingLead, error: fetchError } = await adminSupabase
        .from("leads")
        .select("assigned_closer")
        .eq("id", leadId)
        .single();

      if (fetchError || !existingLead) {
        return NextResponse.json({ success: false, message: "Lead not found." }, { status: 404 });
      }

      if (existingLead.assigned_closer !== profile.id) {
        return NextResponse.json(
          { success: false, message: "This lead is not assigned to you." },
          { status: 403 }
        );
      }
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

    // Postgres date/time columns reject an empty string ("" is not a
    // valid date) — every caller of this route (the admin LeadForm edit,
    // the Closer's Process Lead save, etc.) builds its form state with
    // "" as the empty default, so coerce blank values to null here once
    // rather than relying on each caller to remember to do it.
    for (const field of [
      "dob",
      "callback_date",
      "callback_time",
      "phi_booked_date",
      "phi_booked_time",
    ]) {
      if (field in body && !body[field]) {
        body[field] = null;
      }
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
