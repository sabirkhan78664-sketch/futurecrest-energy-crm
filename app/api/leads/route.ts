import { logActivity } from "@/lib/activity";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { addTimeline } from "@/lib/timeline";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    // ============================================================
    // AUTH — verify the actual logged-in session, don't trust
    // whatever userId the client puts in the request body.
    // ============================================================

    const supabaseAuth = await createSupabaseServerClient();

    const {
      data: { user: authUser },
    } = await supabaseAuth.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please log in again.",
        },
        { status: 401 }
      );
    }

    const {
      data: authProfile,
      error: authProfileError,
    } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .single();

    if (authProfileError || !authProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify your account role.",
        },
        { status: 401 }
      );
    }

    // Only these roles are allowed to create leads at all.
    const allowedCreatorRoles = [
      "Agent",
      "Closer",
      "Admin",
      "Super Admin",
      "Channel Partner",
    ];

    if (
      !allowedCreatorRoles.includes(authProfile.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You don't have permission to create leads.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Verified identity/role — everything below uses these
    // instead of trusting whatever the client sends.
    const verifiedUserId = authUser.id;
    const verifiedRole = authProfile.role;

    // ============================================================
    // CAMPAIGN
    // ============================================================

    const campaign = String(body.campaign || "Energy").trim();

    // Only allow the 3 CRM campaigns
    if (!["Energy", "NBN", "PHI"].includes(campaign)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid campaign. Use Energy, NBN, or PHI.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // DUPLICATE CHECK
    // ============================================================

    // Each field is checked with its own parameterized .eq() query instead
    // of interpolating user input into a single PostgREST .or() filter
    // string — commas/parentheses in mobile/alternate_mobile/nmi would
    // otherwise be parsed as filter syntax and distort the match.
    async function findDuplicateByField(
      field: "mobile" | "alternate_mobile" | "nmi",
      value: string
    ) {
      const { data, error } = await adminSupabase
        .from("leads")
        .select(
          "id, lead_id, customer_name, mobile, alternate_mobile, nmi, status, campaign"
        )
        .eq(field, value)
        .limit(1);

      if (error) throw error;

      return data || [];
    }

    let duplicateLead: any[] = [];

    try {
      if (body.mobile) {
        duplicateLead = await findDuplicateByField(
          "mobile",
          body.mobile
        );
      }

      if (
        duplicateLead.length === 0 &&
        body.alternate_mobile
      ) {
        duplicateLead = await findDuplicateByField(
          "alternate_mobile",
          body.alternate_mobile
        );
      }

      // NMI duplicate check is relevant to Energy
      if (
        duplicateLead.length === 0 &&
        campaign === "Energy" &&
        body.nmi
      ) {
        duplicateLead = await findDuplicateByField(
          "nmi",
          body.nmi
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

    // ============================================================
    // DUPLICATE FOUND
    // ============================================================

    if (
      duplicateLead.length > 0 &&
      !body.allowDuplicate
    ) {
      const duplicateBy: string[] = [];

      if (
        body.mobile &&
        duplicateLead[0].mobile === body.mobile
      ) {
        duplicateBy.push("Mobile Number");
      }

      if (
        body.alternate_mobile &&
        duplicateLead[0].alternate_mobile ===
          body.alternate_mobile
      ) {
        duplicateBy.push("Alternate Mobile Number");
      }

      if (
        campaign === "Energy" &&
        body.nmi &&
        duplicateLead[0].nmi === body.nmi
      ) {
        duplicateBy.push("NMI");
      }

      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          duplicateBy,
          message: "Duplicate lead found.",
          lead: duplicateLead[0],
        },
        { status: 409 }
      );
    }

    // ============================================================
    // ADMIN / SUPER ADMIN DUPLICATE OVERRIDE
    // ============================================================

    if (
      duplicateLead.length > 0 &&
      body.allowDuplicate
    ) {
      if (
        verifiedRole !== "Admin" &&
        verifiedRole !== "Super Admin"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only Admin or Super Admin can create duplicate leads.",
          },
          { status: 403 }
        );
      }

      if (
        !body.duplicateReason ||
        body.duplicateReason.trim() === ""
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Duplicate reason is required.",
          },
          { status: 400 }
        );
      }
    }

    // ============================================================
    // CURRENT USER ROLE — already verified above from the session
    // ============================================================

    const isAdmin =
      verifiedRole === "Admin" ||
      verifiedRole === "Super Admin";

    // ============================================================
    // CAMPAIGN-SPECIFIC LEAD ID GENERATOR
    //
    // ENERGY -> FCSLID00001
    // NBN    -> FCSNLID0001
    // PHI    -> FCSPH00001
    //
    // Each campaign has its OWN counter.
    // ============================================================

    let leadId = "";

    if (campaign === "Energy") {
      // Get the highest existing Energy Lead ID
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

        if (!id.startsWith("FCSLID")) {
          continue;
        }

        const numberPart = id.substring(6);

        if (/^\d+$/.test(numberPart)) {
          const number = parseInt(
            numberPart,
            10
          );

          if (number >= nextNumber) {
            nextNumber = number + 1;
          }
        }
      }

      leadId =
        `FCSLID${String(nextNumber).padStart(5, "0")}`;
    }

    if (campaign === "NBN") {
      // Get the highest existing NBN Lead ID
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
              "Unable to generate NBN Lead ID: " +
              nbnError.message,
          },
          { status: 500 }
        );
      }

      let nextNumber = 1;

      for (const lead of nbnLeads || []) {
        const id = String(lead.lead_id || "");

        if (!id.startsWith("FCSNLID")) {
          continue;
        }

        const numberPart = id.substring(7);

        if (/^\d+$/.test(numberPart)) {
          const number = parseInt(
            numberPart,
            10
          );

          if (number >= nextNumber) {
            nextNumber = number + 1;
          }
        }
      }

      leadId =
        `FCSNLID${String(nextNumber).padStart(4, "0")}`;
    }

    if (campaign === "PHI") {
      // Get the highest existing PHI Lead ID
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
              "Unable to generate PHI Lead ID: " +
              phiError.message,
          },
          { status: 500 }
        );
      }

      let nextNumber = 1;

      for (const lead of phiLeads || []) {
        const id = String(lead.lead_id || "");

        if (!id.startsWith("FCSPH")) {
          continue;
        }

        const numberPart = id.substring(5);

        if (/^\d+$/.test(numberPart)) {
          const number = parseInt(
            numberPart,
            10
          );

          if (number >= nextNumber) {
            nextNumber = number + 1;
          }
        }
      }

      leadId =
        `FCSPH${String(nextNumber).padStart(5, "0")}`;
    }

    // ============================================================
    // SAFETY CHECK
    // ============================================================

    if (!leadId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to generate Lead ID.",
        },
        { status: 500 }
      );
    }

    // ============================================================
    // CREATE LEAD
    // ============================================================

    const { data, error } =
      await adminSupabase
        .from("leads")
        .insert([
          {
            // ==================================================
            // LEAD ID
            // ==================================================

            lead_id: leadId,

            // Store the authenticated user who actually created
            // this lead. Admin assignment must not overwrite this.
            created_by: verifiedUserId,

            // ==================================================
            // CUSTOMER INFORMATION
            // ==================================================

            title:
              body.title || null,

            customer_type:
              body.customer_type || null,

            customer_name:
              body.customer_name,

            mobile:
              body.mobile,

            alternate_mobile:
              body.alternate_mobile,

            email:
              body.email,

            dob:
              body.dob,

            address:
              body.address,

            suburb:
              body.suburb || null,

            state:
              body.state,

            postcode:
              body.postcode,

            // ==================================================
            // CAMPAIGN
            // ==================================================

            campaign,

            // ==================================================
            // ENERGY INFORMATION
            // ==================================================

            nmi:
              campaign === "Energy"
                ? body.nmi
                : null,

            mirn:
              campaign === "Energy"
                ? body.mirn
                : null,

            fuel_type:
              campaign === "Energy"
                ? body.fuel_type
                : null,

            current_retailer:
              campaign === "Energy"
                ? body.current_retailer
                : null,

            offered_retailer:
              campaign === "Energy"
                ? body.offered_retailer
                : null,

            solar:
              campaign === "Energy"
                ? body.solar
                : false,

            concession:
              campaign === "Energy"
                ? body.concession
                : false,

            life_support:
              campaign === "Energy"
                ? body.life_support
                : false,

            // ==================================================
            // DNCR
            // NUMBER/TEXT - NEVER A CHECKBOX
            // ==================================================

            dncr_number:
              body.dncr_number || null,

            // ==================================================
            // NBN
            // ==================================================

            nbn_lt_booking:
              campaign === "NBN"
                ? body.nbn_lt_booking
                : null,

            avc_no:
              campaign === "NBN"
                ? body.avc_no
                : null,

            nbn_provider:
              campaign === "NBN"
                ? body.nbn_provider
                : null,

            paying:
              campaign === "NBN"
                ? body.paying
                : null,

            home_owner:
              campaign === "NBN"
                ? body.home_owner
                : null,

            offered_nbn_retailer:
              campaign === "NBN"
                ? body.offered_nbn_retailer
                : null,

            // ==================================================
            // PHI
            // ==================================================

            phi_first_name:
              campaign === "PHI"
                ? body.phi_first_name
                : null,

            phi_last_name:
              campaign === "PHI"
                ? body.phi_last_name
                : null,

            phi_current_fund:
              campaign === "PHI"
                ? body.phi_current_fund
                : null,

            phi_status:
              campaign === "PHI"
                ? body.phi_status
                : null,

            phi_booked_by:
              campaign === "PHI"
                ? body.phi_booked_by
                : null,

            phi_booked_date:
              campaign === "PHI"
                ? body.phi_booked_date
                : null,

            phi_booked_time:
              campaign === "PHI"
                ? body.phi_booked_time
                : null,

            phi_agent_note:
              campaign === "PHI"
                ? body.phi_agent_note
                : null,

            phi_advisor_feedback:
              campaign === "PHI"
                ? body.phi_advisor_feedback
                : null,

            phi_outcome:
              campaign === "PHI"
                ? body.phi_outcome
                : null,

            // ==================================================
            // COMMENTS
            // ==================================================

            comments:
              body.comments,

            // ==================================================
            // ASSIGNMENT
            // ==================================================

            // Agents own the leads they submit.
            // There is no Agent-to-Agent assignment workflow.
            assigned_agent:
              verifiedRole === "Agent"
                ? verifiedUserId
                : null,

            assigned_closer:
              isAdmin
                ? body.assigned_closer
                : null,

            assignment_status:
              isAdmin && body.assigned_closer
                ? "Assigned"
                : "Pending Approval",

            assigned_at:
              isAdmin && body.assigned_closer
                ? new Date().toISOString()
                : null,

            assigned_by:
              isAdmin && body.assigned_closer
                ? verifiedUserId
                : null,

            // ==================================================
            // APPROVAL
            // ==================================================

            approval_status:
              isAdmin
                ? "Approved"
                : "Pending",

            approved_by:
              isAdmin
                ? verifiedUserId
                : null,

            approved_at:
              isAdmin
                ? new Date().toISOString()
                : null,

            rejected_by:
              null,

            rejected_at:
              null,

            rejection_reason:
              null,

            // ==================================================
            // STATUS
            // ==================================================

            status:
              isAdmin
                ? body.status
                : "Pending Approval",

            // QA is post-sale only. New/non-sold leads are not audited.
            qa_status:
              "Not Required",

            callback_date:
              body.callback_date,

            callback_time:
              body.callback_time,

            // ==================================================
            // LOCK
            // ==================================================

            is_locked:
              false,
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

    await addTimeline({
      lead_id: data.id,
      action: "Lead Created",
      description:
        `${campaign} Lead ${leadId} created.`,
      performed_by:
        verifiedUserId || null,
    });

    // ============================================================
    // ACTIVITY LOG
    // ============================================================

    await logActivity({
      leadId: data.id,
      userId: verifiedUserId,
      activityType: "lead_created",
      description:
        `${campaign} Lead ${leadId} created.`,
    });

    // ============================================================
    // DUPLICATE OVERRIDE LOG
    // ============================================================

    if (body.allowDuplicate) {
      await addTimeline({
        lead_id: data.id,
        action: "Duplicate Override",
        description:
          `Reason: ${body.duplicateReason}`,
        performed_by:
          verifiedUserId || null,
      });
    }

    // ============================================================
    // SUCCESS
    // ============================================================

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (err: any) {
    console.error(
      "Lead API error:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        message:
          err.message ||
          "Server error",
      },
      { status: 500 }
    );
  }
}