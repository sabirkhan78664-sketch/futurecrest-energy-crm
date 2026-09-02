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
