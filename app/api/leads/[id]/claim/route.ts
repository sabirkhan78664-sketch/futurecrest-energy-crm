import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { getCurrentUserProfile } from "@/lib/auth";

const CLAIM_ROLES = ["Admin", "Super Admin", "Closer"];

// "Take Lead" — first click wins. The race safety comes from the
// .is("assigned_closer", null) condition on the UPDATE itself: if two
// people click at nearly the same moment, only the request that reaches
// Postgres first actually matches a row (assigned_closer is still null
// at that instant) and gets a row back. The second request's UPDATE
// matches zero rows — assigned_closer is no longer null by the time it
// runs — so .single() reports "no rows found" and we surface that as a
// clean 409, never a silent overwrite.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (!CLAIM_ROLES.includes(profile.role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Only Admin, Super Admin, or Closer can take a lead.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const leadId = Number(id);

    if (!Number.isInteger(leadId)) {
      return NextResponse.json(
        { success: false, message: "Invalid lead ID." },
        { status: 400 }
      );
    }

    const { data, error } = await adminSupabase
      .from("leads")
      .update({
        assigned_closer: profile.id,
        assigned_at: new Date().toISOString(),
        assigned_by: profile.id,
        assignment_status: "Assigned",
      })
      .eq("id", leadId)
      .is("assigned_closer", null)
      .select()
      .single();

    if (error || !data) {
      // Distinguish "someone else already claimed it" from "lead doesn't
      // exist at all" so the message is actually useful.
      const { data: existing } = await adminSupabase
        .from("leads")
        .select("id, assigned_closer")
        .eq("id", leadId)
        .maybeSingle();

      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Lead not found." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "This lead was already claimed by someone else.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (error) {
    console.error("Take Lead error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to claim this lead.",
      },
      { status: 500 }
    );
  }
}
