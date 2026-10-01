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

export function getPeriodRange(
  period: string,
  timeZone: string = "Asia/Kolkata",
  now: Date = new Date()
): { start: Date; end: Date } | null {
  if (period !== "today" && period !== "week" && period !== "month") {
    return null;
  }

  const t = zonedParts(timeZone, now);

  if (period === "today") {
    return {
      start: zonedMidnight(timeZone, t.year, t.month, t.day),
      end: zonedMidnight(timeZone, t.year, t.month, t.day + 1),
    };
  }

  if (period === "month") {
    return {
      start: zonedMidnight(timeZone, t.year, t.month, 1),
      end: zonedMidnight(timeZone, t.year, t.month + 1, 1),
    };
  }

  // Days since Monday: Mon 0 ... Sat 5; Sunday counts back to the
  // Monday of the week that just ended (6).
  const sinceMonday = t.weekday === 0 ? 6 : t.weekday - 1;

  return {
    start: zonedMidnight(timeZone, t.year, t.month, t.day - sinceMonday),
    // Monday + 6 days = Sunday 00:00, so Saturday is the last day in.
    end: zonedMidnight(timeZone, t.year, t.month, t.day - sinceMonday + 6),
  };
}
