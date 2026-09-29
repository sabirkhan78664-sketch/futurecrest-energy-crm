// Mobile / NMI duplicate matching for the lead import. The normalizers
// mirror the ones in app/api/leads/duplicate-check/route.ts (global
// Energy duplicate search) so both treat the same values as duplicates.

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

// 0456620176, 456620176, +61456620176 and 61456620176 all -> 456620176.
export function normalizeMobileForDuplicate(value: unknown): string {
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

// Uppercase, formatting stripped; an 11-character historical NMI that
// contains a letter is compared on its first 10 characters.
export function normalizeNmi(value: unknown): string {
  let nmi = clean(value).toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!nmi) return "";

  if (nmi.length === 11 && /[A-Z]/.test(nmi)) {
    nmi = nmi.substring(0, 10);
  }

  return nmi;
}

// Blank / placeholder values (e.g. "N/A", "0000000000") never count as
// duplicates of each other.
function mobileKey(value: unknown): string {
  const mobile = normalizeMobileForDuplicate(value);

  return mobile.length >= 8 && !/^0+$/.test(mobile) ? mobile : "";
}

function nmiKey(value: unknown): string {
  const nmi = normalizeNmi(value);

  return nmi.length >= 8 && !/^0+$/.test(nmi) ? nmi : "";
}

function campaignKey(campaign: unknown): string {
  return (clean(campaign) || "Energy").toLowerCase();
}

interface DuplicateFields {
  mobile?: unknown;
  alternate_mobile?: unknown;
  nmi?: unknown;
}

export interface DuplicateMatch {
  field: "Mobile" | "Alternate Mobile" | "NMI";
  value: string;
  // Who it matched, e.g. "existing lead FCSLID00012" or "row 4 in this CSV".
  ref: string;
}

// In-memory index of already-known leads (existing CRM leads, then each
// accepted CSV row), scoped per campaign. Mobile and alternate mobile
// share one key space, so a mobile matching someone's alternate mobile
// is a duplicate too.
export class LeadDuplicateIndex {
  private mobiles = new Map<string, string>();
  private nmis = new Map<string, string>();
  // Exactly-10-character NMIs, and the first 10 characters of longer
  // ones — lets 10- and 11-character historical formats match each other
  // the same way nmiMatches() does in the duplicate search.
  private nmiTen = new Map<string, string>();
  private nmiLongPrefix = new Map<string, string>();

  add(campaign: unknown, lead: DuplicateFields, ref: string) {
    const c = campaignKey(campaign);

    for (const value of [lead.mobile, lead.alternate_mobile]) {
      const key = mobileKey(value);

      if (key && !this.mobiles.has(`${c}|${key}`)) {
        this.mobiles.set(`${c}|${key}`, ref);
      }
    }

    const nmi = nmiKey(lead.nmi);

    if (nmi) {
      if (!this.nmis.has(`${c}|${nmi}`)) this.nmis.set(`${c}|${nmi}`, ref);

      if (nmi.length === 10 && !this.nmiTen.has(`${c}|${nmi}`)) {
        this.nmiTen.set(`${c}|${nmi}`, ref);
      }

      const prefix = `${c}|${nmi.substring(0, 10)}`;

      if (nmi.length > 10 && !this.nmiLongPrefix.has(prefix)) {
        this.nmiLongPrefix.set(prefix, ref);
      }
    }
  }

  find(campaign: unknown, lead: DuplicateFields): DuplicateMatch[] {
    const c = campaignKey(campaign);
    const matches: DuplicateMatch[] = [];

    const mobileFields: Array<[DuplicateMatch["field"], unknown]> = [
      ["Mobile", lead.mobile],
      ["Alternate Mobile", lead.alternate_mobile],
    ];

    for (const [field, value] of mobileFields) {
      const key = mobileKey(value);
      const ref = key ? this.mobiles.get(`${c}|${key}`) : undefined;

      if (ref) matches.push({ field, value: clean(value), ref });
    }

    const nmi = nmiKey(lead.nmi);

    if (nmi) {
      const ref =
        this.nmis.get(`${c}|${nmi}`) ??
        (nmi.length === 10
          ? this.nmiLongPrefix.get(`${c}|${nmi}`)
          : undefined) ??
        (nmi.length > 10
          ? this.nmiTen.get(`${c}|${nmi.substring(0, 10)}`)
          : undefined);

      if (ref) matches.push({ field: "NMI", value: clean(lead.nmi), ref });
    }

    return matches;
  }
}
