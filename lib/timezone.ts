// "Today" boundaries must be evaluated in the business's own timezone,
// not the server runtime's local time. On Vercel that runtime is UTC,
// so computing "today" from new Date()'s own getFullYear/getMonth/
// getDate() silently uses the UTC calendar day instead — e.g. a lead
// closed during India's morning (already "today" locally, but still
// UTC's previous day for roughly the first 5.5 hours of IST) would
// fall out of a "Today" filter entirely.
//
// Asia/Kolkata matches the "today" convention already used elsewhere
// in this codebase (app/my-leads/page.tsx, app/agent/page.tsx).

export function getZonedTodayStart(
  timeZone: string,
  now: Date = new Date()
): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(now)
    .reduce((acc: Record<string, string>, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  // An instant whose UTC wall-clock digits match the zoned wall-clock
  // digits for "now" — the difference between it and the real "now" is
  // exactly the zone's current UTC offset.
  const fakeUtcNow = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  const offsetMs = fakeUtcNow - now.getTime();

  // Midnight of that same zoned calendar day, expressed the same
  // "fake UTC" way, then corrected by the offset to get the real UTC
  // instant.
  const fakeUtcMidnight = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    0,
    0,
    0
  );

  return new Date(fakeUtcMidnight - offsetMs);
}


// ============================================================
// CALENDAR PERIODS (Today / This week / This month)
//
// Fixed calendar ranges in the business timezone, returned as an
// inclusive start and EXCLUSIVE end instant: start <= date < end.
//   today = this calendar day
//   week  = Monday through Saturday (Sunday excluded). On a Sunday it
//           stays the Monday-Saturday week that just finished.
//   month = 1st of the month up to the 1st of the next month
//   yesterday / last_week / last_month = the previous such period
//   custom = from/to dates, both included
// ============================================================

function zonedParts(timeZone: string, instant: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(instant)
    .reduce((acc: Record<string, string>, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      parts.weekday
    ),
  };
}

// The real instant of midnight starting the given zoned calendar day.
// Date.UTC normalises overflowing days/months (e.g. day 32).
function zonedMidnight(
  timeZone: string,
  year: number,
  month: number,
  day: number
): Date {
  const wallClock = Date.UTC(year, month - 1, day);

  let result = wallClock;

  // Two passes so the offset is taken at the boundary itself (DST-safe).
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(timeZone, new Date(result));
    const shown = Date.UTC(
      p.year,
      p.month - 1,
      p.day,
      p.hour,
      p.minute,
      p.second
    );

    result -= shown - wallClock;
  }

  return new Date(result);
}

export interface CustomRange {
  // Inclusive calendar dates in the business timezone, "YYYY-MM-DD".
  from?: string | null;
  to?: string | null;
}

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateOnly(value?: string | null) {
  const match = DATE_RE.exec(String(value ?? "").trim());

  if (!match) return null;

  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ];

  // Reject impossible dates such as 2026-02-31.
  const check = new Date(Date.UTC(year, month - 1, day));

  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

// Supported periods: today, yesterday, week, last_week, month,
// last_month, custom ("all"/anything else = null = no restriction).
// `custom` is only read for period === "custom"; existing callers that
// pass just a period (or period/timeZone/now) are unaffected.
export function getPeriodRange(
  period: string,
  timeZone: string = "Asia/Kolkata",
  now: Date = new Date(),
  custom?: CustomRange
): { start: Date; end: Date } | null {
  if (period === "custom") {
    const from = parseDateOnly(custom?.from);
    const to = parseDateOnly(custom?.to);

    if (!from || !to) return null;

    let [first, last] = [from, to];

    // Selected in the wrong order — treat as the same range.
    if (
      Date.UTC(first.year, first.month - 1, first.day) >
      Date.UTC(last.year, last.month - 1, last.day)
    ) {
      [first, last] = [last, first];
    }

    return {
      start: zonedMidnight(timeZone, first.year, first.month, first.day),
      // Both selected dates are included: end = day after the last one.
      end: zonedMidnight(timeZone, last.year, last.month, last.day + 1),
    };
  }

  if (
    ![
      "today",
      "yesterday",
      "week",
      "last_week",
      "month",
      "last_month",
    ].includes(period)
  ) {
    return null;
  }

  const t = zonedParts(timeZone, now);

  if (period === "today") {
    return {
      start: zonedMidnight(timeZone, t.year, t.month, t.day),
      end: zonedMidnight(timeZone, t.year, t.month, t.day + 1),
    };
  }

  if (period === "yesterday") {
    return {
      start: zonedMidnight(timeZone, t.year, t.month, t.day - 1),
      end: zonedMidnight(timeZone, t.year, t.month, t.day),
    };
  }

  if (period === "month") {
    return {
      start: zonedMidnight(timeZone, t.year, t.month, 1),
      end: zonedMidnight(timeZone, t.year, t.month + 1, 1),
    };
  }

  if (period === "last_month") {
    return {
      start: zonedMidnight(timeZone, t.year, t.month - 1, 1),
      end: zonedMidnight(timeZone, t.year, t.month, 1),
    };
  }

  // Days since Monday: Mon 0 ... Sat 5; Sunday counts back to the
  // Monday of the week that just ended (6).
  const sinceMonday = t.weekday === 0 ? 6 : t.weekday - 1;
  const monday = t.day - sinceMonday;

  if (period === "last_week") {
    return {
      start: zonedMidnight(timeZone, t.year, t.month, monday - 7),
      // Previous Monday + 6 days = that Sunday 00:00 (Saturday is last in).
      end: zonedMidnight(timeZone, t.year, t.month, monday - 1),
    };
  }

  return {
    start: zonedMidnight(timeZone, t.year, t.month, monday),
    // Monday + 6 days = Sunday 00:00, so Saturday is the last day in.
    end: zonedMidnight(timeZone, t.year, t.month, monday + 6),
  };
}


// Validation for a Custom range, kept separate from getPeriodRange() (which
// returns null for bad input and so must never be used to decide "show
// everything"). Returns a message for the user, or null when both dates are
// real calendar dates (either order is accepted).
export function validateCustomRange(custom?: CustomRange): string | null {
  const from = String(custom?.from ?? "").trim();
  const to = String(custom?.to ?? "").trim();

  if (!from || !to) {
    return "Please select both a start date and an end date.";
  }

  if (!parseDateOnly(from)) {
    return "Start date is not a valid date.";
  }

  if (!parseDateOnly(to)) {
    return "End date is not a valid date.";
  }

  return null;
}
