"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validateCustomRange } from "@/lib/timezone";

export const DASHBOARD_PERIOD_TABS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This week" },
  { key: "last_week", label: "Last week" },
  { key: "month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "custom", label: "Custom" },
  { key: "all", label: "All time" },
];

// Dashboard period selector. Custom shows a Start/End date picker; both
// dates are included in the range (see getPeriodRange in lib/timezone.ts).
export default function DashboardPeriodTabs({
  period,
  from = "",
  to = "",
  basePath = "/dashboard",
  onSelectPeriod,
  onApplyCustom,
}: {
  period: string;
  from?: string;
  to?: string;
  basePath?: string;
  // Controlled mode (Leads page keeps the period in client state): when
  // set, tabs call these instead of navigating by URL.
  onSelectPeriod?: (period: string) => void;
  onApplyCustom?: (from: string, to: string) => void;
}) {
  const router = useRouter();

  const [showCustom, setShowCustom] = useState(period === "custom");
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);

  // Shown for a bad Custom range arriving in the URL as well as for one
  // typed here — an invalid date never falls back to "All time".
  const [error, setError] = useState<string | null>(
    period === "custom" ? validateCustomRange({ from, to }) : null
  );

  function applyCustom() {
    const problem = validateCustomRange({ from: start, to: end });

    if (problem) {
      setError(problem);
      return;
    }

    setError(null);

    if (onApplyCustom) {
      onApplyCustom(start, end);
      return;
    }

    router.push(
      `${basePath}?period=custom&from=${start}&to=${end}`
    );
  }

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-xs font-medium transition ${
      active
        ? "bg-blue-600 text-white"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {DASHBOARD_PERIOD_TABS.map((tab) =>
          tab.key === "custom" ? (
            <button
              key={tab.key}
              type="button"
              onClick={() => setShowCustom((previous) => !previous)}
              className={tabClass(period === "custom")}
            >
              {tab.label}
            </button>
          ) : onSelectPeriod ? (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setError(null);
                onSelectPeriod(tab.key);
              }}
              className={tabClass(period === tab.key)}
            >
              {tab.label}
            </button>
          ) : (
            <Link
              key={tab.key}
              href={`${basePath}?period=${tab.key}`}
              className={tabClass(period === tab.key)}
            >
              {tab.label}
            </Link>
          )
        )}
      </div>

      {showCustom && (
        <>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            aria-label="Start date"
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
          />

          <span className="text-xs text-slate-400">to</span>

          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-label="End date"
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
          />

          <button
            type="button"
            onClick={applyCustom}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Apply
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="w-full text-xs font-medium text-red-600"
          >
            {error}
          </p>
        )}
        </>
      )}
    </div>
  );
}
