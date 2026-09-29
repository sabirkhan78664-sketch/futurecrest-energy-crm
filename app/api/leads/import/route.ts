import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { LeadDuplicateIndex } from "@/lib/leadDuplicates";

const clean = (v: any) => String(v ?? "").trim();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ImportIssue {
  row: number;
  lead_id: string | null;
  customer_name: string | null;
  reason: string;
}

// Every existing lead's duplicate-relevant fields, paged because
// PostgREST caps a single response (1000 rows by default on Supabase).
async function loadExistingLeads() {
  const pageSize = 1000;
  const leads: any[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await adminSupabase
      .from("leads")
      .select("lead_id, campaign, mobile, alternate_mobile, nmi")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    leads.push(...data);
  }

  return leads;
}

const campaignPrefix: Record<string, string> = {
  Energy: "FCSLID",
  NBN: "FCSNLID",
  PHI: "FCSPH",
};

// `reserved` = Lead IDs already claimed in this import (given in the CSV
// or generated for another campaign group) so generated IDs never
// collide with them.
async function nextLeadIds(
  campaign: string,
  count: number,
  reserved: string[] = []
) {
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
  for (const leadId of [
    ...(data || []).map((row) => String(row.lead_id || "")),
    ...reserved,
  ]) {
    const match = leadId.toUpperCase().match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) max = Math.max(max, Number(match[1]));
  }

  return Array.from(
    { length: count },
    (_, i) => `${prefix}${String(max + i + 1).padStart(5, "0")}`
  );
}

function mapLead(
  row: any,
  generatedLeadId: string | null,
  userId: string,
  previous?: { status: string | null; closed_at: string | null }
) {
  const status = clean(row.status) || "Sold";
  const isSold = status === "Sold";

  // Every dashboard metric buckets by closed_at, not status or
  // created_at — an imported Sold/Lost row with no closed_at would be
  // silently invisible on the dashboard forever. Respects an explicit
  // closed_at column if the CSV provides one. For an UPDATE to an
  // existing lead_id (previous is set), only re-stamp closed_at when
  // status is actually transitioning — otherwise re-importing an
  // already-Sold row to fix an unrelated column would wrongly reset
  // its sale date to today. New inserts (no previous row) keep the
  // original stamp-on-Sold/Lost behavior.
  const closedAt = clean(row.closed_at)
    ? clean(row.closed_at)
    : !previous
      ? status === "Sold" || status === "Lost"
        ? new Date().toISOString()
        : null
      : previous.status === status
        ? previous.closed_at
        : status === "Sold" || status === "Lost"
          ? new Date().toISOString()
          : status === "Follow-up"
            ? null
            : previous.closed_at;

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

    // Spreadsheet row number of a CSV data row (row 1 is the header).
    const rowNumber = (index: number) => index + 2;

    // ============================================================
    // KNOWN LEADS — existing CRM leads seed the duplicate index; each
    // accepted CSV row is added to it too, so duplicates inside the CSV
    // are caught by the same check. Nothing existing is ever updated.
    // ============================================================

    const existingLeads = await loadExistingLeads();

    const existingLeadIds = new Set(
      existingLeads
        .map((lead) => clean(lead.lead_id).toUpperCase())
        .filter(Boolean)
    );

    const duplicateIndex = new LeadDuplicateIndex();

    for (const lead of existingLeads) {
      duplicateIndex.add(
        lead.campaign,
        lead,
        `existing lead ${lead.lead_id || "(no Lead ID)"}`
      );
    }

    // ============================================================
    // ASSIGNMENT — assigned_agent/assigned_closer must be real profile
    // UUIDs. An employee ID is converted to that person's UUID; any other
    // value (e.g. a name like "PETER") is left unassigned with a warning.
    // ============================================================

    const { data: people, error: peopleError } = await adminSupabase
      .from("profiles")
      .select("id, employee_id");

    if (peopleError) throw new Error(peopleError.message);

    const profileIds = new Set(
      (people || []).map((person) => String(person.id).toLowerCase())
    );

    const profileIdByEmployeeId = new Map(
      (people || [])
        .filter((person) => clean(person.employee_id))
        .map((person) => [
          clean(person.employee_id).toUpperCase(),
          String(person.id),
        ])
    );

    function resolvePerson(value: string): string | null {
      if (UUID_RE.test(value) && profileIds.has(value.toLowerCase())) {
        return value.toLowerCase();
      }

      return profileIdByEmployeeId.get(value.toUpperCase()) ?? null;
    }

    // ============================================================
    // CHECK EVERY ROW
    // ============================================================

    const duplicates: ImportIssue[] = [];
    const errors: ImportIssue[] = [];
    const warnings: ImportIssue[] = [];
    const accepted: { row: any; rowNumber: number }[] = [];
    const csvLeadIds = new Map<string, number>();

    rows.forEach((rawRow: any, index: number) => {
      const row = { ...rawRow };
      const number = rowNumber(index);
      const leadId = clean(row.lead_id);
      const campaign = clean(row.campaign) || "Energy";
      const issue = {
        row: number,
        lead_id: leadId || null,
        customer_name: clean(row.customer_name) || null,
      };

      const reasons: string[] = [];

      if (leadId) {
        const key = leadId.toUpperCase();

        if (existingLeadIds.has(key)) {
          reasons.push(`Lead ID ${leadId} already exists in the CRM`);
        } else if (csvLeadIds.has(key)) {
          reasons.push(
            `Lead ID ${leadId} repeats row ${csvLeadIds.get(key)} in this CSV`
          );
        }
      }

      for (const match of duplicateIndex.find(campaign, row)) {
        reasons.push(`${match.field} ${match.value} matches ${match.ref}`);
      }

      if (reasons.length) {
        duplicates.push({ ...issue, reason: reasons.join("; ") });
        return;
      }

      for (const field of ["assigned_agent", "assigned_closer"] as const) {
        const value = clean(row[field]);

        if (!value) continue;

        const personId = resolvePerson(value);

        if (!personId) {
          warnings.push({
            ...issue,
            reason: `${field} "${value}" is not a CRM user ID or employee ID — left unassigned`,
          });
        }

        row[field] = personId || "";
      }

      if (leadId) csvLeadIds.set(leadId.toUpperCase(), number);
      duplicateIndex.add(campaign, row, `row ${number} in this CSV`);
      accepted.push({ row: { ...row, campaign }, rowNumber: number });
    });

    // ============================================================
    // LEAD IDs — rows with a (new) lead_id keep it; the rest get normal
    // generated CRM IDs that never collide with the kept ones.
    // ============================================================

    const reservedLeadIds = accepted
      .map((item) => clean(item.row.lead_id))
      .filter(Boolean);

    const grouped: Record<string, typeof accepted> = {};

    for (const item of accepted) {
      if (clean(item.row.lead_id)) continue;
      if (!grouped[item.row.campaign]) grouped[item.row.campaign] = [];
      grouped[item.row.campaign].push(item);
    }

    const generatedLeadIds = new Map<number, string>();

    for (const [campaign, items] of Object.entries(grouped)) {
      const ids = await nextLeadIds(campaign, items.length, reservedLeadIds);

      items.forEach((item, index) => {
        generatedLeadIds.set(item.rowNumber, ids[index]);
      });

      reservedLeadIds.push(...ids);
    }

    const newRows = accepted.map((item) => ({
      rowNumber: item.rowNumber,
      payload: mapLead(
        item.row,
        generatedLeadIds.get(item.rowNumber) ?? null,
        user.id
      ),
    }));

    // ============================================================
    // INSERT — in chunks; if a chunk is rejected, retry its rows one by
    // one so a single bad row can't block every other valid row.
    // ============================================================

    let inserted = 0;
    const chunkSize = 500;

    for (let start = 0; start < newRows.length; start += chunkSize) {
      const chunk = newRows.slice(start, start + chunkSize);

      const { error } = await adminSupabase
        .from("leads")
        .insert(chunk.map((item) => item.payload));

      if (!error) {
        inserted += chunk.length;
        continue;
      }

      for (const item of chunk) {
        const { error: rowError } = await adminSupabase
          .from("leads")
          .insert(item.payload);

        if (rowError) {
          errors.push({
            row: item.rowNumber,
            lead_id: item.payload.lead_id,
            customer_name: item.payload.customer_name,
            reason: rowError.message,
          });
        } else {
          inserted++;
        }
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      inserted,
      duplicates,
      errors,
      warnings,
      message: `Import complete: ${inserted} imported, ${duplicates.length} duplicate(s) skipped, ${errors.length} error(s).`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Import/update failed." },
      { status: 500 }
    );
  }
}
