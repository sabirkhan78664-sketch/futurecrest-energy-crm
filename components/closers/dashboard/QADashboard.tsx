import Link from "next/link";
import { adminSupabase } from "@/lib/admin";
import StateClocks from "@/components/dashboard/StateClocks";
import DashboardPeriodTabs from "@/components/dashboard/DashboardPeriodTabs";
import { getPeriodRange } from "@/lib/timezone";
import {
  ClipboardCheck,
  ListChecks,
  ShoppingBag,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default async function QADashboard({
  period = "today",
  from = "",
  to = "",
}: {
  period?: string;
  from?: string;
  to?: string;
}) {
  // Every Sold-derived count here is bucketed by closed_at (when the sale
  // outcome was actually recorded), not created_at — an old lead sold or
  // audited today still counts as today's activity.
  const periodRange = getPeriodRange(period, undefined, undefined, {
    from,
    to,
  });

  let soldQuery = adminSupabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "Sold");

  let approvedQuery = adminSupabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "Sold")
    .eq("qa_status", "Approved");

  let rejectedQuery = adminSupabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "Sold")
    .eq("qa_status", "Rejected");

  let notAuditedQuery = adminSupabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "Sold")
    .not("qa_status", "in", "(Approved,Rejected)");

  if (periodRange) {
    const start = periodRange.start.toISOString();
    const end = periodRange.end.toISOString();

    // start inclusive, end exclusive
    soldQuery = soldQuery.gte("closed_at", start).lt("closed_at", end);
    approvedQuery = approvedQuery.gte("closed_at", start).lt("closed_at", end);
    rejectedQuery = rejectedQuery.gte("closed_at", start).lt("closed_at", end);
    notAuditedQuery = notAuditedQuery.gte("closed_at", start).lt("closed_at", end);
  }

  const [
    { count: allCount },
    { count: soldCount },
    { count: approvedCount },
    { count: rejectedCount },
    { count: notAuditedCount },
  ] = await Promise.all([
    adminSupabase.from("leads").select("id", { count: "exact", head: true }),
    soldQuery,
    approvedQuery,
    rejectedQuery,
    notAuditedQuery,
  ]);

  const cards = [
    {
      href: "/qa?filter=all",
      label: "All Leads",
      value: allCount ?? 0,
      hint: "View every lead",
      icon: ListChecks,
      className: "border-blue-200 bg-blue-50 text-blue-800",
    },
    {
      href: "/qa?filter=sold",
      label: "Sold Leads",
      value: soldCount ?? 0,
      hint: "View completed sales",
      icon: ShoppingBag,
      className: "border-amber-200 bg-amber-50 text-amber-800",
    },
    {
      href: "/qa?filter=not-audited",
      label: "Audit Available",
      value: notAuditedCount ?? 0,
      hint: "Optional Sold-lead audit",
      icon: ClipboardCheck,
      className: "border-orange-200 bg-orange-50 text-orange-800",
    },
    {
      href: "/qa?filter=approved",
      label: "QA Approved",
      value: approvedCount ?? 0,
      hint: "Approved audits",
      icon: CheckCircle2,
      className: "border-green-200 bg-green-50 text-green-800",
    },
    {
      href: "/qa?filter=rejected",
      label: "QA Rejected",
      value: rejectedCount ?? 0,
      hint: "Rejected audits",
      icon: XCircle,
      className: "border-red-200 bg-red-50 text-red-800",
    },
  ];

  return (
    <div className="space-y-5">
      <StateClocks />

      <DashboardPeriodTabs period={period} from={from} to={to} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${card.className}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{card.label}</span>
                <Icon size={19} />
              </div>
              <p className="mt-2 text-3xl font-bold">{card.value}</p>
              <p className="mt-1 text-xs opacity-75">{card.hint}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
