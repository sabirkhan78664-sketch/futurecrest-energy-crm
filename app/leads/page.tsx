import MainLayout from "@/components/layout/MainLayout";
import LeadsClient from "@/components/leads/LeadsClient";
import { getLeads } from "@/lib/leads";
import Link from "next/link";

export default async function LeadsPage() {
  const leads = await getLeads();

  const totalLeads = leads.length;

  const todayLeads = leads.filter((lead: any) => {
    if (!lead.created_at) return false;

    const today = new Date().toISOString().split("T")[0];
    return lead.created_at.startsWith(today);
  }).length;

  const interested = leads.filter(
    (lead: any) => lead.status === "Interested"
  ).length;

  const sales = leads.filter(
    (lead: any) => lead.status === "Sale"
  ).length;

  const callbacks = leads.filter(
    (lead: any) => lead.status === "Callback"
  ).length;

  const rejected = leads.filter(
    (lead: any) =>
      lead.status === "Rejected" ||
      lead.status === "Lost"
  ).length;

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Lead Management
            </h1>

            <p className="text-slate-500">
              Manage FutureCrest Energy Leads
            </p>
          </div>

          <Link
            href="/leads/new"
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            + New Lead
          </Link>

        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-6">

          <StatCard
            title="Total Leads"
            value={totalLeads}
            color="text-blue-600"
          />

          <StatCard
            title="Today's Leads"
            value={todayLeads}
            color="text-indigo-600"
          />

          <StatCard
            title="Interested"
            value={interested}
            color="text-cyan-600"
          />

          <StatCard
            title="Sales"
            value={sales}
            color="text-green-600"
          />

          <StatCard
            title="Callbacks"
            value={callbacks}
            color="text-yellow-600"
          />

          <StatCard
            title="Rejected"
            value={rejected}
            color="text-red-600"
          />

        </div>

        {/* Leads Table */}
        <LeadsClient leads={leads} />

      </div>
    </MainLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: string;
}

function StatCard({
  title,
  value,
  color,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <h2 className={`mt-3 text-3xl font-bold ${color}`}>
        {value}
      </h2>

    </div>
  );
} 