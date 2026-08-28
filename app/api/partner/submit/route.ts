import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { addTimeline } from "@/lib/timeline";

/*
|--------------------------------------------------------------------------
| PUBLIC PARTNER LEAD INTAKE
|--------------------------------------------------------------------------
| No login required — partners submit from outside the CRM. Security is
| enforced by validating partner_code against a real, active Channel
| Partner account (each partner has their own unique code, generated
| from their employee_id when created), not by a session. Uses
| adminSupabase (service role) since there is no user session to
| authenticate the insert with.
|--------------------------------------------------------------------------
*/

function cleanString(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ============================================================
    // PARTNER CODE — the only "auth" this route has.
    // ============================================================

    const partnerCode = String(
      body.partner_code ||
        req.nextUrl.searchParams.get("partner") ||
        ""
    ).trim();

    if (!partnerCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or missing partner code.",
        },
        { status: 400 }
      );
    }

    const { data: partnerProfile, error: partnerLookupError } =
      await adminSupabase
        .from("profiles")
        .select("id")
        .eq("role", "Channel Partner")
        .eq("partner_code", partnerCode)
        .eq("status", "Active")
        .maybeSingle();

    if (partnerLookupError) {
      return NextResponse.json(
        {
          success: false,
          message: partnerLookupError.message,
        },
        { status: 500 }
      );
    }

    if (!partnerProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or missing partner code.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // CAMPAIGN
    // ============================================================

    const campaign = String(body.campaign || "").trim();

    if (!["Energy", "NBN", "PHI"].includes(campaign)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid campaign. Use Energy, PHI, or NBN.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // REQUIRED FIELDS
    // ============================================================

    const customerName = String(body.customer_name || "").trim();
    const mobile = String(body.mobile || "").trim();
    const postcode = String(body.postcode || "").trim();
    const dncrNumber = String(body.dncr_number || "").trim();
    const agentName = String(body.agent_name || "").trim();

    const missing: string[] = [];

    if (!customerName) missing.push("customer_name");
    if (!mobile) missing.push("mobile");
    if (!postcode) missing.push("postcode");
    if (!dncrNumber) missing.push("dncr_number");
    if (!agentName) missing.push("agent_name");

    if (dncrNumber && !/^\d+$/.test(dncrNumber)) {
      return NextResponse.json(
        {
          success: false,
          message: "DNCR must contain numbers only.",
        },
        { status: 400 }
      );
    }

    if (campaign === "Energy" && !String(body.offered_retailer || "").trim()) {
      missing.push("offered_retailer");
    }

    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required field(s): ${missing.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // DUPLICATE CHECK
    // ============================================================
    //
    // Each field is checked with its own parameterized .eq() query —
    // NOT a single interpolated .or() filter string, which would let
    // a comma/parenthesis in mobile or nmi distort the match into
    // matching unintended rows (the injection bug fixed elsewhere).

    async function findDuplicateByField(
      field: "mobile" | "nmi",
      value: string
    ) {
      const { data, error } = await adminSupabase
        .from("leads")
        .select("id, lead_id, mobile, nmi")
        .eq(field, value)
        .limit(1);

      if (error) throw error;

      return data || [];
    }

    let duplicateLead: any[] = [];

    try {
      if (mobile) {
        duplicateLead = await findDuplicateByField("mobile", mobile);
      }

      if (
        duplicateLead.length === 0 &&
        campaign === "Energy" &&
        body.nmi
      ) {
        duplicateLead = await findDuplicateByField(
          "nmi",
          String(body.nmi).trim()
        );
      }
    } catch (duplicateError: any) {
      return NextResponse.json(
        {
          success: false,
          message: duplicateError.message,
        },
        { status: 400 }
      );
    }

    if (duplicateLead.length > 0) {
      const duplicateBy: string[] = [];

      if (mobile && duplicateLead[0].mobile === mobile) {
        duplicateBy.push("Mobile Number");
      }

      if (
        campaign === "Energy" &&
        body.nmi &&
        duplicateLead[0].nmi === String(body.nmi).trim()
      ) {
        duplicateBy.push("NMI");
      }

      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          duplicateBy,
          message: "Duplicate lead found.",
        },
        { status: 409 }
      );
    }

    // ============================================================
    // CAMPAIGN-SPECIFIC LEAD ID GENERATOR
    //
    // ENERGY -> FCSLID00001
    // NBN    -> FCSNLID0001
    // PHI    -> FCSPH00001
    //
    // Same per-campaign counter pattern as app/api/leads/route.ts.
    // ============================================================

    let leadId = "";

    if (campaign === "Energy") {
      const { data: energyLeads, error: energyError } =
        await adminSupabase
          .from("leads")
          .select("lead_id")
          .eq("campaign", "Energy")
          .like("lead_id", "FCSLID%")
          .order("lead_id", { ascending: false })
          .limit(100);

      if (energyError) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to generate Energy Lead ID: " +
              energyError.message,
          },
          { status: 500 }
        );
      }

      let nextNumber = 1;

      for (const lead of energyLeads || []) {
        const id = String(lead.lead_id || "");

        if (!id.startsWith("FCSLID")) continue;

        const numberPart = id.substring(6);

        if (/^\d+$/.test(numberPart)) {
          const number = parseInt(numberPart, 10);
          if (number >= nextNumber) nextNumber = number + 1;
        }
      }

      leadId = `FCSLID${String(nextNumber).padStart(5, "0")}`;
    }

    if (campaign === "NBN") {
      const { data: nbnLeads, error: nbnError } =
        await adminSupabase
          .from("leads")
          .select("lead_id")
          .eq("campaign", "NBN")
          .like("lead_id", "FCSNLID%")
          .order("lead_id", { ascending: false })
          .limit(100);

      if (nbnError) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to generate NBN Lead ID: " + nbnError.message,
          },
          { status: 500 }
        );
      }

      let nextNumber = 1;

      for (const lead of nbnLeads || []) {
        const id = String(lead.lead_id || "");

        if (!id.startsWith("FCSNLID")) continue;

        const numberPart = id.substring(7);

        if (/^\d+$/.test(numberPart)) {
          const number = parseInt(numberPart, 10);
          if (number >= nextNumber) nextNumber = number + 1;
        }
      }

      leadId = `FCSNLID${String(nextNumber).padStart(4, "0")}`;
    }

    if (campaign === "PHI") {
      const { data: phiLeads, error: phiError } =
        await adminSupabase
          .from("leads")
          .select("lead_id")
          .eq("campaign", "PHI")
          .like("lead_id", "FCSPH%")
          .order("lead_id", { ascending: false })
          .limit(100);

      if (phiError) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Unable to generate PHI Lead ID: " + phiError.message,
          },
          { status: 500 }
        );
      }

      let nextNumber = 1;

      for (const lead of phiLeads || []) {
        const id = String(lead.lead_id || "");

        if (!id.startsWith("FCSPH")) continue;

        const numberPart = id.substring(5);

        if (/^\d+$/.test(numberPart)) {
          const number = parseInt(numberPart, 10);
          if (number >= nextNumber) nextNumber = number + 1;
        }
      }

      leadId = `FCSPH${String(nextNumber).padStart(5, "0")}`;
    }

    if (!leadId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to generate Lead ID.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // CREATE LEAD
    // ============================================================

    const { data, error } = await adminSupabase
      .from("leads")
      .insert([
        {
          lead_id: leadId,

          title: cleanString(body.title),
          customer_type: cleanString(body.customer_type),
          customer_name: customerName,

          mobile,
          alternate_mobile: cleanString(body.alternate_mobile),
          email: cleanString(body.email),
          dob: cleanString(body.dob),
          address: cleanString(body.address),
          suburb: cleanString(body.suburb),
          state: cleanString(body.state),
          postcode,

          campaign,

          // ================================================
          // ENERGY
          // ================================================

          fuel_type:
            campaign === "Energy" ? cleanString(body.fuel_type) : null,

          current_retailer:
            campaign === "Energy"
              ? cleanString(body.current_retailer)
              : null,

          offered_retailer:
            campaign === "Energy"
              ? cleanString(body.offered_retailer)
              : null,

          nmi: campaign === "Energy" ? cleanString(body.nmi) : null,

          mirn: campaign === "Energy" ? cleanString(body.mirn) : null,

          solar: campaign === "Energy" ? Boolean(body.solar) : false,

          concession:
            campaign === "Energy" ? Boolean(body.concession) : false,

          life_support:
            campaign === "Energy" ? Boolean(body.life_support) : false,

          // ================================================
          // NBN
          // ================================================

          avc_no: campaign === "NBN" ? cleanString(body.avc_no) : null,

          nbn_provider:
            campaign === "NBN" ? cleanString(body.nbn_provider) : null,

          paying: campaign === "NBN" ? cleanString(body.paying) : null,

          home_owner:
            campaign === "NBN" ? cleanString(body.home_owner) : null,

          offered_nbn_retailer:
            campaign === "NBN"
              ? cleanString(body.offered_nbn_retailer)
              : null,

          // ================================================
          // PHI
          // ================================================

          phi_first_name:
            campaign === "PHI" ? cleanString(body.phi_first_name) : null,

          phi_last_name:
            campaign === "PHI" ? cleanString(body.phi_last_name) : null,

          phi_current_fund:
            campaign === "PHI"
              ? cleanString(body.phi_current_fund)
              : null,

          phi_status:
            campaign === "PHI" ? cleanString(body.phi_status) : null,

          phi_lt_booking:
            campaign === "PHI"
              ? cleanString(body.phi_lt_booking)
              : null,

          phi_booked_by:
            campaign === "PHI" ? cleanString(body.phi_booked_by) : null,

          phi_booked_date:
            campaign === "PHI"
              ? cleanString(body.phi_booked_date)
              : null,

          phi_booked_time:
            campaign === "PHI"
              ? cleanString(body.phi_booked_time)
              : null,

          phi_agent_note:
            campaign === "PHI"
              ? cleanString(body.phi_agent_note)
              : null,

          phi_advisor_feedback:
            campaign === "PHI"
              ? cleanString(body.phi_advisor_feedback)
              : null,

          phi_outcome:
            campaign === "PHI" ? cleanString(body.phi_outcome) : null,

          comments: cleanString(body.comments),

          dncr_number: dncrNumber,

          agent_name: cleanString(body.agent_name),

          // Auto-tags which partner this lead came from. Always the
          // server-validated code, never trusting a client-sent value.
          channel_name: partnerCode,

          // Dedicated column for partner-dashboard matching — channel_name
          // is also a free-text field Closers overwrite on the sales
          // outcome form, so it can't be relied on to still hold the
          // partner code by the time the lead is processed.
          partner_code: partnerCode,

          approval_status: "Pending",
          status: "Pending Approval",
          assignment_status: "Pending Approval",

          qa_status: "Not Required",

          // No CRM user submitted this — it came from outside the CRM.
          created_by: null,
          assigned_agent: null,

          is_locked: false,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    // ============================================================
    // TIMELINE
    // ============================================================

    try {
      await addTimeline({
        lead_id: data.id,
        action: "Lead Created",
        description: `${campaign} Lead ${leadId} submitted via ${partnerCode} partner portal.`,
        performed_by: null,
      });
    } catch (timelineError) {
      // Timeline failure must never block a successful partner submission.
      console.error("Partner submit timeline error:", timelineError);
    }

    // ============================================================
    // SUCCESS
    // ============================================================

    return NextResponse.json(
      {
        success: true,
        lead_id: leadId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Partner submit API error:", err);

    return NextResponse.json(
      {
        success: false,
        message: err.message || "Server error",
      },
      { status: 500 }
    );
  }
}
