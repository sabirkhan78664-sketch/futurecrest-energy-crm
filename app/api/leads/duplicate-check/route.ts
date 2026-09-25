import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeMobileForDuplicate(value: unknown): string {
  let digits = clean(value).replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("61") && digits.length === 11) {
    digits = digits.substring(2);
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    digits = digits.substring(1);
  }

  return digits;
}

function mobileVariants(value: unknown): string[] {
  const raw = clean(value);
  const digits = raw.replace(/\D/g, "");
  const normalized = normalizeMobileForDuplicate(raw);
  const variants = new Set<string>();

  if (digits) variants.add(digits);
  if (normalized) variants.add(normalized);

  if (normalized.length === 9) {
    variants.add(`0${normalized}`);
    variants.add(`61${normalized}`);
    variants.add(`+61${normalized}`);
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    variants.add(`61${digits.substring(1)}`);
    variants.add(`+61${digits.substring(1)}`);
  }

  if (digits.length === 11 && digits.startsWith("61")) {
    variants.add(`0${digits.substring(2)}`);
    variants.add(digits.substring(2));
  }

  return Array.from(variants).filter(Boolean);
}

function normalizeNmi(value: unknown): string {
  let nmi = clean(value).toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!nmi) return "";

  if (nmi.length === 11 && /[A-Z]/.test(nmi)) {
    nmi = nmi.substring(0, 10);
  }

  return nmi;
}

function nmiMatches(query: string, stored: unknown): boolean {
  const wanted = normalizeNmi(query);
  const existing = normalizeNmi(stored);

  if (!wanted || !existing) return false;

  return (
    wanted === existing ||
    (wanted.length === 10 && existing.startsWith(wanted)) ||
    (existing.length === 10 && wanted.startsWith(existing))
  );
}

export async function GET(req: NextRequest) {
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

    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "Unable to verify your account." },
        { status: 401 }
      );
    }

    const allowedRoles = [
      "Agent",
      "Closer",
      "Admin",
      "Super Admin",
      "QA",
      "Supervisor",
      "Channel Partner",
    ];

    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { success: false, message: "You don't have permission to search leads." },
        { status: 403 }
      );
    }

    const query = clean(req.nextUrl.searchParams.get("q"));

    if (!query) {
      return NextResponse.json({ success: true, leads: [] });
    }

    const digits = query.replace(/\D/g, "");
    const compact = query.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const looksLikeMobile = digits.length >= 9 && digits.length <= 13;
    const looksLikeNmi = compact.length >= 8 && compact.length <= 14;

    if (!looksLikeMobile && !looksLikeNmi) {
      return NextResponse.json({ success: true, leads: [] });
    }

    const results = new Map<number, any>();

    /* =========================================================
       MOBILE — SEARCH ALL ENERGY LEADS
    ========================================================= */
    if (looksLikeMobile) {
      const normalizedQuery = normalizeMobileForDuplicate(query);
      const variants = mobileVariants(query);

      if (normalizedQuery || variants.length) {
        // Search by substring as well as exact variants. This catches historical
        // records stored as 043..., 433..., 61433..., or +61433... .
        const searchTerms = Array.from(
          new Set([normalizedQuery, ...variants.map((v) => v.replace(/\D/g, ""))])
        ).filter(Boolean);

        const clauses = searchTerms.flatMap((term) => [
          `mobile.ilike.%${term}%`,
          `alternate_mobile.ilike.%${term}%`,
        ]);

        const { data: mobileLeads, error: mobileError } = await adminSupabase
          .from("leads")
          .select(
            "id, lead_id, customer_name, mobile, alternate_mobile, nmi, status, campaign"
          )
          .ilike("campaign", "Energy")
          .or(clauses.join(","))
          .limit(1000);

        if (mobileError) throw mobileError;

        for (const lead of mobileLeads || []) {
          const wanted = normalizeMobileForDuplicate(query);
          const primary = normalizeMobileForDuplicate(lead.mobile);
          const alternate = normalizeMobileForDuplicate(lead.alternate_mobile);

          if (wanted && (wanted === primary || wanted === alternate)) {
            results.set(Number(lead.id), lead);
          }
        }
      }
    }

    /* =========================================================
       NMI — SEARCH ALL ENERGY LEADS
    ========================================================= */
    if (looksLikeNmi) {
      const normalized = normalizeNmi(query);

      if (normalized) {
        // Search both directions so 10-character and 11-character historical
        // NMI formats can match each other.
        const nmiTerms = Array.from(
          new Set([
            normalized,
            normalized.length >= 10 ? normalized.substring(0, 10) : normalized,
          ])
        );

        const clauses = nmiTerms.map((term) => `nmi.ilike.%${term}%`);

        const { data: nmiLeads, error: nmiError } = await adminSupabase
          .from("leads")
          .select(
            "id, lead_id, customer_name, mobile, alternate_mobile, nmi, status, campaign"
          )
          .ilike("campaign", "Energy")
          .or(clauses.join(","))
          .limit(1000);

        if (nmiError) throw nmiError;

        for (const lead of nmiLeads || []) {
          if (nmiMatches(normalized, lead.nmi)) {
            results.set(Number(lead.id), lead);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      query,
      leads: Array.from(results.values()).slice(0, 100),
    });
  } catch (error: any) {
    console.error("Global Energy duplicate check error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Duplicate check failed.",
      },
      { status: 500 }
    );
  }
}
