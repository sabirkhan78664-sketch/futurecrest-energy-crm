import Link from "next/link";
import { adminSupabase } from "@/lib/admin";
import StateClocks from "@/components/dashboard/StateClocks";
import {
  ClipboardCheck,
  ListChecks,
  ShoppingBag,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const PERIOD_TABS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

function getPeriodStart(period: string): string | null {
  const now = new Date();

  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }

  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start.toISOString();
  }

  if (period === "month") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start.toISOString();
  }

  return null;
}

export default async function QADashboard({
  period = "today",
}: {
  period?: string;
}) {
  // Every Sold-derived count here is bucketed by closed_at (when the sale
  // outcome was actually recorded), not created_at — an old lead sold or
  // audited today still counts as today's activity.
  const periodStart = getPeriodStart(period);

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

  if (periodStart) {
    soldQuery = soldQuery.gte("closed_at", periodStart);
    approvedQuery = approvedQuery.gte("closed_at", periodStart);
    rejectedQuery = rejectedQuery.gte("closed_at", periodStart);
    notAuditedQuery = notAuditedQuery.gte("closed_at", periodStart);
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

      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {PERIOD_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard?period=${tab.key}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              period === tab.key
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

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
