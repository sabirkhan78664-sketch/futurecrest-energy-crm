import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { getCurrentUserProfile } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function cleanDate(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return null;
  }

  return value;
}

function cleanString(value: unknown) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
| Load one lead assigned to (owned by) the logged-in Closer, Admin, or
| Super Admin — ownership (assigned_closer === profile.id) is what's
| checked below, not role alone.
|--------------------------------------------------------------------------
*/

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    const leadId = Number(id);

    if (!Number.isInteger(leadId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lead ID.",
        },
        { status: 400 }
      );
    }

    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (
      !["Closer", "Admin", "Super Admin"].includes(
        profile.role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Closer, Admin, or Super Admin access required.",
        },
        { status: 403 }
      );
    }

    const {
      data: lead,
      error,
    } = await adminSupabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found.",
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SECURITY
    |--------------------------------------------------------------------------
    */

    if (lead.assigned_closer !== profile.id) {
      return NextResponse.json(
        {
          success: false,
          message: "This lead is not assigned to you.",
        },
        { status: 403 }
      );
    }

    if (lead.approval_status !== "Approved") {
      return NextResponse.json(
        {
          success: false,
          message: "This lead has not been approved.",
        },
        { status: 403 }
      );
    }

    const personIds = [lead.created_by, lead.assigned_agent, lead.assigned_closer]
      .filter(Boolean);

    const { data: people } = personIds.length
      ? await adminSupabase
          .from("profiles")
          .select("id, employee_id, full_name, username")
          .in("id", personIds)
      : { data: [] as any[] };

    const peopleMap = new Map((people ?? []).map((person: any) => [person.id, person]));

    const enrichedLead = {
      ...lead,
      creator: lead.created_by ? peopleMap.get(lead.created_by) ?? null : null,
      agent: lead.assigned_agent ? peopleMap.get(lead.assigned_agent) ?? null : null,
      closer: lead.assigned_closer ? peopleMap.get(lead.assigned_closer) ?? null : null,
    };

    return NextResponse.json({
      success: true,
      lead: enrichedLead,
    });
  } catch (error: any) {
    console.error("Closer GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to load lead.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
| Closer, Admin, or Super Admin can ONLY process an outcome here:
|
| Sold, Interested, Processing, No Answer, Follow-up, Lost, Internal DNC,
| NGTG
|
| Whoever calls this must currently own the lead — assigned_closer must
| equal their own profile id, checked below regardless of role. An
| Admin/Super Admin does not get a role-based bypass: taking a lead via
| Take Lead is what makes them the owner, same as a Closer.
|
| General lead editing goes through /api/leads/[id]/edit instead.
|--------------------------------------------------------------------------
*/

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await params;

    const leadId = Number(id);

    if (!Number.isInteger(leadId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid lead ID.",
        },
        { status: 400 }
      );
    }

    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (
      !["Closer", "Admin", "Super Admin"].includes(
        profile.role
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Closer, Admin, or Super Admin access required.",
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | LOAD LEAD
    |--------------------------------------------------------------------------
    */

    const {
      data: existingLead,
      error: fetchError,
    } = await adminSupabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (fetchError || !existingLead) {
      return NextResponse.json(
        {
          success: false,
          message: "Lead not found.",
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SECURITY CHECK
    |--------------------------------------------------------------------------
    */

    if (
      existingLead.assigned_closer !==
      profile.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This lead is not assigned to you.",
        },
        { status: 403 }
      );
    }

    if (
      existingLead.approval_status !==
      "Approved"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This lead has not been approved.",
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | REQUEST BODY
    |--------------------------------------------------------------------------
    */

    const body = await request.json();

    const action = body?.action;

    /*
    |--------------------------------------------------------------------------
    | GENERAL EDIT IS DISABLED
    |--------------------------------------------------------------------------
    */

    if (action === "edit") {
      return NextResponse.json(
        {
          success: false,
          message:
            "General lead editing is not allowed for Closers.",
        },
        { status: 403 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | ONLY OUTCOME IS ALLOWED
    |--------------------------------------------------------------------------
    */

    if (
      action !== "outcome" &&
      action !== undefined &&
      action !== null
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action.",
        },
        { status: 400 }
      );
    }

    const outcome = body?.outcome;

    /*
    |--------------------------------------------------------------------------
    | VALIDATE OUTCOME
    |--------------------------------------------------------------------------
    */

    if (
      ![
        "Sold",
        "Interested",
        "Processing",
        "No Answer",
        "Follow-up",
        "Lost",
        "Internal DNC",
        "NGTG",
      ].includes(outcome)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid outcome.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SOLD / LOST CANNOT BE REOPENED
    |--------------------------------------------------------------------------
    | ...except by Admin/Super Admin, who are allowed to reopen a closed
    | lead and record a new outcome. A Closer (including one who owns a
    | now-closed lead) still cannot.
    |--------------------------------------------------------------------------
    */

    const canReopenClosedLead = [
      "Admin",
      "Super Admin",
    ].includes(profile.role);

    if (
      !canReopenClosedLead &&
      (existingLead.status === "Sold" ||
        existingLead.status === "Lost")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This lead has already been closed.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FOLLOW-UP
    |--------------------------------------------------------------------------
    */

    const callbackDate =
      outcome === "Follow-up"
        ? cleanDate(body?.callback_date)
        : null;

    const callbackTime =
      outcome === "Follow-up"
        ? cleanString(body?.callback_time)
        : null;

    if (outcome === "Follow-up") {
      if (
        !callbackDate ||
        !callbackTime
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Follow-up date and time are required.",
          },
          { status: 400 }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | CLOSER COMMENTS
    |--------------------------------------------------------------------------
    */

    const closerComments =
      typeof body?.comments === "string"
        ? body.comments.trim() || null
        : existingLead.comments;

    /*
    |--------------------------------------------------------------------------
    | BASE UPDATE
    |--------------------------------------------------------------------------
    */

    const updateData: Record<
      string,
      any
    > = {
        status: outcome,

        // Post-Sale QA is available only after the Closer marks the lead Sold.
        qa_status:
          outcome === "Sold"
            ? "Not Audited"
            : "Not Required",

      assignment_status:
        outcome === "Follow-up"
          ? "Follow-up"
          : outcome,

      callback_date:
        callbackDate,

      callback_time:
        callbackTime,

      comments:
        closerComments,

      cl_id:
        body?.cl_id || null,

      channel_name:
        body?.channel_name || null,

      // Defaults to null; the Sold/Lost blocks below override this with
      // a fresh timestamp. Needed so that when Admin/Super Admin reopens
      // a closed lead and picks a non-terminal outcome (Interested,
      // Processing, No Answer, Internal DNC, NGTG), the stale closed_at
      // from the previous Sold/Lost doesn't linger on the record.
      closed_at:
        null,
    };

    /*
    |--------------------------------------------------------------------------
    | SOLD
    |--------------------------------------------------------------------------
    | Existing DB has no final_retailer column.
    |
    | Therefore:
    | Final Retailer -> offered_retailer
    |--------------------------------------------------------------------------
    */

    if (outcome === "Sold") {
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          "offered_retailer"
        )
      ) {
        updateData.offered_retailer =
          cleanString(
            body.offered_retailer
          );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          body,
          "fuel_type"
        )
      ) {
        updateData.fuel_type =
          cleanString(
            body.fuel_type
          );
      }

      if (
        Object.prototype.hasOwnProperty.call(
          body,
          "campaign"
        )
      ) {
        updateData.campaign =
          cleanString(
            body.campaign
          );
      }

      updateData.closed_at =
        new Date().toISOString();
    }

    /*
    |--------------------------------------------------------------------------
    | LOST
    |--------------------------------------------------------------------------
    */

    if (outcome === "Lost") {
      updateData.closed_at =
        new Date().toISOString();
    }

    /*
    |--------------------------------------------------------------------------
    | FOLLOW-UP
    |--------------------------------------------------------------------------
    */

    if (outcome === "Follow-up") {
      updateData.closed_at = null;
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE DATABASE
    |--------------------------------------------------------------------------
    */

    const {
      data: updatedLead,
      error: updateError,
    } = await adminSupabase
      .from("leads")
      .update(updateData)
      .eq("id", leadId)
      .eq(
        "assigned_closer",
        profile.id
      )
      .select("*")
      .single();

    if (updateError) {
      console.error(
        "Closer outcome error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            updateError.message,
        },
        { status: 500 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | POST-SALE QA NOTIFICATION
    |--------------------------------------------------------------------------
    | A Sold lead is visible to QA immediately. QA audit remains optional.
    */

    if (outcome === "Sold") {
      try {
        const { data: qaUsers, error: qaUsersError } =
          await adminSupabase
            .from("profiles")
            .select("id")
            .eq("role", "QA")
            .neq("status", "Inactive");

        if (qaUsersError) {
          console.error("QA notification user lookup error:", qaUsersError);
        } else if (qaUsers?.length) {
          const notifications = qaUsers.map((qaUser: any) => ({
            user_id: qaUser.id,
            title: "New Sold Lead — QA Available",
            message: `${updatedLead.lead_id || `Lead #${updatedLead.id}`} has been marked Sold by ${profile.full_name || "Closer"}. QA audit is available when required.`,
            type: "post_sale_qa",
            reference_id: updatedLead.id,
          }));

          const { error: notificationError } =
            await adminSupabase
              .from("notifications")
              .insert(notifications);

          if (notificationError) {
            console.error(
              "QA notification insert error:",
              notificationError
            );
          } else {
            await Promise.all(
              notifications.map((notification) =>
                sendPushToUser(notification.user_id, {
                  title: notification.title,
                  body: notification.message,
                  url: `/leads/${notification.reference_id}`,
                }).catch((pushError) => {
                  console.error(
                    "QA push notification error:",
                    pushError
                  );
                })
              )
            );
          }
        }
      } catch (notificationError) {
        // Notification failure must never block the Sold transaction.
        console.error("QA notification error:", notificationError);
      }
    }

    /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

    return NextResponse.json({
      success: true,
      message:
        `Lead marked as ${outcome}.`,
      lead: updatedLead,
    });
  } catch (error: any) {
    console.error(
      "Closer PATCH error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to update lead.",
      },
      { status: 500 }
    );
  }
}