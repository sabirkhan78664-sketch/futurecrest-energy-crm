import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { adminSupabase } from "@/lib/admin";

/*
|--------------------------------------------------------------------------
| LEADS CSV EXPORT
|--------------------------------------------------------------------------
| Admin / Super Admin get every lead, full column set, optionally scoped
| by ?campaign=/&status=/&from=/&to=/&channel=.
|
| Channel Partner gets only their own leads (matched by partner_code —
| never the full leads table), optionally scoped by ?period=.
|--------------------------------------------------------------------------
*/

function csvEscape(value: unknown) {
  const str = value === null || value === undefined ? "" : String(value);

  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function formatDateTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function yesNo(value: unknown) {
  return value ? "Yes" : "No";
}

function getPeriodStart(period: string | null): string | null {
  if (!period || period === "all") return null;

  const now = new Date();

  if (period === "today") {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();
  }

  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start.toISOString();
  }

  if (period === "month") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start.toISOString();
  }

  return null;
}

const CSV_HEADERS = [
  "Lead ID",
  "Campaign",
  "Customer Name",
  "Mobile",
  "Alternate Mobile",
  "Email",
  "Date of Birth",
  "Title",
  "Customer Type",
  "Address",
  "Suburb",
  "State",
  "Postcode",
  "Fuel Type",
  "Current Retailer",
  "Offered Retailer",
  "NMI",
  "MIRN",
  "Solar",
  "Concession",
  "Life Support",
  "DNCR Number",
  "Status",
  "Approval Status",
  "QA Status",
  "Channel Name",
  "Client Lead ID",
  "Agent Name",
  "Comments",
  "Created At",
  "Assigned At",
];

function toRow(lead: any) {
  return [
    lead.lead_id,
    lead.campaign,
    lead.customer_name,
    lead.mobile,
    lead.alternate_mobile,
    lead.email,
    lead.dob,
    lead.title,
    lead.customer_type,
    lead.address,
    lead.suburb,
    lead.state,
    lead.postcode,
    lead.fuel_type,
    lead.current_retailer,
    lead.offered_retailer,
    lead.nmi,
    lead.mirn,
    yesNo(lead.solar),
    yesNo(lead.concession),
    yesNo(lead.life_support),
    lead.dncr_number,
    lead.status,
    lead.approval_status,
    lead.qa_status,
    lead.channel_name,
    lead.cl_id,
    lead.agent_name,
    lead.comments,
    formatDateTime(lead.created_at),
    formatDateTime(lead.assigned_at),
  ];
}

export async function GET(req: NextRequest) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 }
    );
  }

  const isPartner = profile.role === "Channel Partner";
  const isAdmin = ["Admin", "Super Admin"].includes(profile.role);

  if (!isPartner && !isAdmin) {
    return NextResponse.json(
      { success: false, message: "Not authorized to export leads." },
      { status: 403 }
    );
  }

  if (isPartner && !profile.partner_code) {
    return NextResponse.json(
      { success: false, message: "No partner code assigned to this account." },
      { status: 403 }
    );
  }

  let query = adminSupabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (isPartner) {
    query = query.eq("partner_code", profile.partner_code);

    const periodStart = getPeriodStart(req.nextUrl.searchParams.get("period"));
    if (periodStart) {
      query = query.gte("created_at", periodStart);
    }
  } else {
    const campaign = req.nextUrl.searchParams.get("campaign");
    const status = req.nextUrl.searchParams.get("status");
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    const channel = req.nextUrl.searchParams.get("channel");

    if (campaign) query = query.eq("campaign", campaign);
    if (status) query = query.eq("status", status);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);
    if (channel) query = query.eq("channel_name", channel);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  const csv = [CSV_HEADERS, ...(data ?? []).map(toRow)]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="leads-export-${today}.csv"`,
    },
  });
}
