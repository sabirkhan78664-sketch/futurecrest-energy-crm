"use client";

import { useEffect, useState } from "react";

const ZONES = [
  { code: "NSW", timeZone: "Australia/Sydney" },
  { code: "VIC", timeZone: "Australia/Melbourne" },
  { code: "QLD", timeZone: "Australia/Brisbane" },
  { code: "SA", timeZone: "Australia/Adelaide" },
] as const;

function formatTime(timeZone: string) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date());
}

// Seeded with static placeholders (not a live Date read, which would be
// an impure call during render) — the effect below fills in real times
// right after mount and then keeps them ticking every second.
export default function StateClocks() {
  const [times, setTimes] = useState<string[]>(() =>
    ZONES.map(() => "--:--:--")
  );

  useEffect(() => {
    function tick() {
      setTimes(
        ZONES.map((zone) => formatTime(zone.timeZone))
      );
    }

    tick();

    const interval = window.setInterval(tick, 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
        Local Time
      </span>

      {ZONES.map((zone, index) => (
        <div
          key={zone.code}
          className="flex items-baseline gap-1.5"
        >
          <span className="text-xs font-bold text-slate-500">
            {zone.code}
          </span>

          <span className="font-mono text-sm font-semibold text-slate-800">
            {times[index]}
          </span>
        </div>
      ))}
    </div>
  );
}
