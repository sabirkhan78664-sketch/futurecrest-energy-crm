import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";

/*
|--------------------------------------------------------------------------
| PARTNER CODE VALIDATION
|--------------------------------------------------------------------------
| Public, read-only check used by the /submit page to decide whether to
| show the lead form or the "invalid link" screen, before the visitor
| fills anything in. The actual submission is re-validated server-side
| regardless — this is just for a fast, accurate front-end decision.
|--------------------------------------------------------------------------
*/

export async function GET(req: NextRequest) {
  const partnerCode = (req.nextUrl.searchParams.get("partner") || "").trim();

  if (!partnerCode) {
    return NextResponse.json({ valid: false });
  }

  const { data } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("role", "Channel Partner")
    .eq("partner_code", partnerCode)
    .eq("status", "Active")
    .maybeSingle();

  return NextResponse.json({ valid: !!data });
}
