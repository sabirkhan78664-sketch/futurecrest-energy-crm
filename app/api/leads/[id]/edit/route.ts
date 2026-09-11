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

    // Single fetch of the lead's current state, reused by the Closer
    // ownership check below, the reassignment bookkeeping, and the
    // closed_at transition check further down — previously each of
    // those ran its own separate fetch, which is how the closed_at
    // check drifted out of sync and re-stamped closed_at on every save
    // instead of only on a genuine status change.
    const { data: existingLead, error: fetchError } = await adminSupabase
      .from("leads")
      .select("assigned_closer, status")
      .eq("id", leadId)
      .maybeSingle();

    if (fetchError || !existingLead) {
      return NextResponse.json({ success: false, message: "Lead not found." }, { status: 404 });
    }

    // A Closer may only edit a lead assigned to them — Admin/Super Admin
    // keep unrestricted access to every lead.
    if (!isAdmin && existingLead.assigned_closer !== profile.id) {
      return NextResponse.json(
        { success: false, message: "This lead is not assigned to you." },
        { status: 403 }
      );
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

    // REASSIGNMENT — only Admin/Super Admin may change who a lead is
    // assigned to. Strip both fields for anyone else so the request
    // still saves everything else about the lead, it just has no
    // effect on assignment.
    if (!isAdmin) {
      delete body.assigned_agent;
      delete body.assigned_closer;
    }

    // Reassigning to a different Closer needs the same bookkeeping the
    // approval workflow already sets when it assigns a closer, otherwise
    // the lead ends up with a new assigned_closer next to a stale
    // assigned_at/assigned_by from whoever had it before.
    if (
      isAdmin &&
      "assigned_closer" in body &&
      existingLead.assigned_closer !== (body.assigned_closer || null)
    ) {
      body.assignment_status = body.assigned_closer ? "Assigned" : "Unassigned";
      body.assigned_at = body.assigned_closer ? new Date().toISOString() : null;
      body.assigned_by = body.assigned_closer ? profile.id : null;
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

    // Every dashboard metric buckets by closed_at, not status or
    // created_at — mirrors the Closer's Process Lead save path
    // (app/api/closer/sales/[id]/route.ts) so a lead marked Sold/Lost
    // through this general edit form actually counts on the dashboard.
    // Only fires on a genuine status transition (compared against the
    // lead's existing status fetched above) — editing an unrelated
    // field like the assigned agent on an already-Sold lead must never
    // move its closed_at. Skipped entirely if the caller already sent
    // their own closed_at, so an explicit backdate/correction is
    // respected.
    if (
      "status" in body &&
      body.status !== existingLead.status &&
      !("closed_at" in body)
    ) {
      if (body.status === "Sold" || body.status === "Lost") {
        body.closed_at = new Date().toISOString();
      } else if (body.status === "Follow-up") {
        body.closed_at = null;
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
