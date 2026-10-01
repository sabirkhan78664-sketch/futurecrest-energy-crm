import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { adminSupabase } from "@/lib/admin";
import { getPeriodRange, validateCustomRange } from "@/lib/timezone";

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

  } else {
    // The Leads filters are multi-select, so the toolbar sends each
    // selected value as a repeated query param (?status=Sold&status=Lost)
    // instead of a single value.
    const campaign = req.nextUrl.searchParams.getAll("campaign");
    const status = req.nextUrl.searchParams.getAll("status");
    const from = req.nextUrl.searchParams.get("from");
    const to = req.nextUrl.searchParams.get("to");
    const channel = req.nextUrl.searchParams.get("channel");

    if (campaign.length) query = query.in("campaign", campaign);
    if (status.length) query = query.in("status", status);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);
    if (channel) query = query.eq("channel_name", channel);

    // Same extra filters the Leads page applies (multi-select).
    const fuel = req.nextUrl.searchParams.getAll("fuel");
    const channels = req.nextUrl.searchParams.getAll("channel_name");
    const agents = req.nextUrl.searchParams.getAll("agent");

    if (fuel.length) query = query.in("fuel_type", fuel);
    if (channels.length) query = query.in("channel_name", channels);

    // Agent filter: leads assigned to the person, or submitted through
    // the Channel Partner's partner_code.
    if (agents.length) {
      const { data: partners } = await adminSupabase
        .from("profiles")
        .select("partner_code")
        .eq("role", "Channel Partner")
        .in("id", agents)
        .not("partner_code", "is", null);

      const codes = (partners ?? []).map((p: any) => p.partner_code);
      const clauses = [`assigned_agent.in.(${agents.join(",")})`];

      if (codes.length) {
        clauses.push(`partner_code.in.(${codes.map((c: string) => `"${c}"`).join(",")})`);
      }

      query = query.or(clauses.join(","));
    }
  }

  // PERIOD — the same calendar range as the Leads page table
  // (getPeriodRange), with the same date field rule: Sold leads by
  // closed_at, everything else by created_at. Start inclusive, end
  // exclusive. Applies to every role; "all" / missing = no restriction.
  // Never export everything because a Custom date was invalid.
  if (req.nextUrl.searchParams.get("period") === "custom") {
    const problem = validateCustomRange({
      from: req.nextUrl.searchParams.get("period_from"),
      to: req.nextUrl.searchParams.get("period_to"),
    });

    if (problem) {
      return NextResponse.json(
        { success: false, message: problem },
        { status: 400 }
      );
    }
  }

  const periodRange = getPeriodRange(
    req.nextUrl.searchParams.get("period") ?? "",
    undefined,
    undefined,
    {
      from: req.nextUrl.searchParams.get("period_from"),
      to: req.nextUrl.searchParams.get("period_to"),
    }
  );

  if (periodRange) {
    const start = periodRange.start.toISOString();
    const end = periodRange.end.toISOString();

    query = query.or(
      [
        `and(status.eq.Sold,closed_at.gte.${start},closed_at.lt.${end})`,
        `and(status.neq.Sold,created_at.gte.${start},created_at.lt.${end})`,
        `and(status.is.null,created_at.gte.${start},created_at.lt.${end})`,
      ].join(",")
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }

  return csvResponse(data ?? []);
}

function csvResponse(leads: any[]) {
  const csv = [CSV_HEADERS, ...leads.map(toRow)]
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

// SEARCH MODE — when the Leads search box has text, the table shows its
// own search result set and ignores the toolbar filters. The page sends
// those exact lead ids so the CSV is precisely what is on screen; the
// same role rules as GET still apply (partners only ever get rows
// carrying their own partner_code).
export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));

  const ids: number[] = Array.isArray(body?.ids)
    ? body.ids.map(Number).filter((id: number) => Number.isInteger(id))
    : [];

  const leads: any[] = [];

  // Chunked so a large result list doesn't overflow the request URL.
  for (let i = 0; i < ids.length; i += 200) {
    let query = adminSupabase
      .from("leads")
      .select("*")
      .in("id", ids.slice(i, i + 200));

    if (isPartner) query = query.eq("partner_code", profile.partner_code);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    leads.push(...(data ?? []));
  }

  leads.sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() -
      new Date(a.created_at ?? 0).getTime()
  );

  return csvResponse(leads);
}
