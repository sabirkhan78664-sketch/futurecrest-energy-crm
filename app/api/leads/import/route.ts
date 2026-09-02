import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const clean = (v: any) => String(v ?? "").trim();

const campaignPrefix: Record<string, string> = {
  Energy: "FCSLID",
  NBN: "FCSNLID",
  PHI: "FCSPH",
};

async function nextLeadIds(campaign: string, count: number) {
  const prefix = campaignPrefix[campaign] || "FCSLID";

  const { data, error } = await adminSupabase
    .from("leads")
    .select("lead_id")
    .eq("campaign", campaign)
    .like("lead_id", `${prefix}%`)
    .order("lead_id", { ascending: false })
    .limit(10000);

  if (error) throw new Error(error.message);

  let max = 0;
  for (const row of data || []) {
    const match = String(row.lead_id || "").match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) max = Math.max(max, Number(match[1]));
  }

  return Array.from(
    { length: count },
    (_, i) => `${prefix}${String(max + i + 1).padStart(5, "0")}`
  );
}

function mapLead(row: any, generatedLeadId: string | null, userId: string) {
  const status = clean(row.status) || "Sold";
  const isSold = status === "Sold";

  // Every dashboard metric buckets by closed_at, not status or
  // created_at — an imported Sold/Lost row with no closed_at would be
  // silently invisible on the dashboard forever. Respects an explicit
  // closed_at column if the CSV provides one.
  const closedAt =
    clean(row.closed_at) ||
    (status === "Sold" || status === "Lost"
      ? new Date().toISOString()
      : null);

  return {
    lead_id: clean(row.lead_id) || generatedLeadId,
    title: clean(row.title) || null,
    customer_type: clean(row.customer_type) || null,
    customer_name: clean(row.customer_name) || null,
    mobile: clean(row.mobile) || null,
    alternate_mobile: clean(row.alternate_mobile) || null,
    email: clean(row.email) || null,
    nmi: clean(row.nmi) || null,
    campaign: clean(row.campaign) || "Energy",
    fuel_type: clean(row.fuel_type) || null,
    current_retailer: clean(row.current_retailer) || null,
    offered_retailer: clean(row.offered_retailer) || null,
    address: clean(row.address) || null,
    suburb: clean(row.suburb) || null,
    state: clean(row.state) || null,
    postcode: clean(row.postcode) || null,
    dob: clean(row.dob) || null,
    comments: clean(row.comments) || null,
    status,
    approval_status: clean(row.approval_status) || "Approved",
    assigned_agent: clean(row.assigned_agent) || null,
    assigned_closer: clean(row.assigned_closer) || null,
    assignment_status:
      clean(row.assigned_closer) ? "Assigned" : "Unassigned",
    qa_status: isSold ? "Not Audited" : "Not Required",
    closed_at: closedAt,
    created_by: userId,
    approved_by: userId,
    approved_at: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await createSupabaseServerClient();
    const {
      data: { user },
    } = await auth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "Super Admin") {
      return NextResponse.json(
        { success: false, message: "Only Super Admin can import/update leads." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const rows = Array.isArray(body.rows) ? body.rows : [];

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: "No rows supplied." },
        { status: 400 }
      );
    }

    if (rows.length > 5000) {
      return NextResponse.json(
        { success: false, message: "Maximum 5,000 rows per import." },
        { status: 400 }
      );
    }

    const withLeadId = rows.filter((row: any) => clean(row.lead_id));
    const withoutLeadId = rows.filter((row: any) => !clean(row.lead_id));

    // Existing lead_id = UPDATE. This intentionally does not run a new
    // duplicate model; the CRM's existing duplicate logic remains unchanged.
    let updated = 0;
    const updateErrors: any[] = [];

    for (const row of withLeadId) {
      const payload = mapLead(row, clean(row.lead_id), user.id);

      const { error } = await adminSupabase
        .from("leads")
        .update(payload)
        .eq("lead_id", clean(row.lead_id));

      if (error) {
        updateErrors.push({
          lead_id: clean(row.lead_id),
          error: error.message,
        });
      } else {
        updated++;
      }
    }

    // Rows without lead_id are NEW records. Generate normal CRM lead IDs.
    const grouped: Record<string, any[]> = {};
    for (const row of withoutLeadId) {
      const campaign = clean(row.campaign) || "Energy";
      if (!grouped[campaign]) grouped[campaign] = [];
      grouped[campaign].push(row);
    }

    const newRows: any[] = [];

    for (const [campaign, campaignRows] of Object.entries(grouped)) {
      const ids = await nextLeadIds(campaign, campaignRows.length);
      campaignRows.forEach((row, index) => {
        newRows.push(mapLead({ ...row, campaign }, ids[index], user.id));
      });
    }

    let inserted = 0;
    let insertError: string | null = null;

    if (newRows.length) {
      const { error } = await adminSupabase
        .from("leads")
        .insert(newRows);

      if (error) {
        insertError = error.message;
      } else {
        inserted = newRows.length;
      }
    }

    return NextResponse.json({
      success: !insertError && updateErrors.length === 0,
      updated,
      inserted,
      failedUpdates: updateErrors.length,
      updateErrors,
      error: insertError,
      message: insertError
        ? `Updated ${updated}, but new-record import failed: ${insertError}`
        : `Import complete: ${updated} updated, ${inserted} new records.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Import/update failed." },
      { status: 500 }
    );
  }
}
