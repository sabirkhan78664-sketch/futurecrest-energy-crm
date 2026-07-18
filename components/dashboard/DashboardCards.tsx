"use client";

import StatsCard from "./StatsCard";

interface DashboardStats {
  totalLeads: number;
  todayLeads: number;
  sales: number;
  callbacks: number;
  interested: number;
  pending: number;
  rejected: number;
}

interface Props {
  stats: DashboardStats;
}

export default function DashboardCards({ stats }: Props) {
  const cards = [
  {
    title: "Total Leads",
    value: stats.totalLeads,
    color: "text-blue-600",
    href: "/leads",
  },
  {
    title: "Today's Leads",
    value: stats.todayLeads,
    color: "text-indigo-600",
    href: "/leads",
  },
  {
    title: "Interested",
    value: stats.interested,
    color: "text-cyan-600",
    href: "/leads",
  },
  {
    title: "Sales",
    value: stats.sales,
    color: "text-green-600",
    href: "/reports",
  },
  {
    title: "Callbacks",
    value: stats.callbacks,
    color: "text-yellow-600",
    href: "/followups",
  },
  {
    title: "Pending",
    value: stats.pending,
    color: "text-orange-600",
    href: "/leads",
  },
  {
    title: "Rejected",
    value: stats.rejected,
    color: "text-red-600",
    href: "/leads",
  },
  {
    title: "Conversion",
    value:
      stats.totalLeads > 0
        ? `${((stats.sales / stats.totalLeads) * 100).toFixed(1)}%`
        : "0%",
    color: "text-purple-600",
    href: "/reports",
  },
];

  return (
    <div className="grid gap-2 grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <StatsCard
  key={card.title}
  title={card.title}
  value={card.value}
  color={card.color}
  href={card.href}
/>
      ))}
    </div>
  );
}