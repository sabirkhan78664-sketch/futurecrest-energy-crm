import MainLayout from "@/components/layout/MainLayout";
import { getDashboardStats } from "@/lib/dashboard";
import Link from "next/link";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
    },
    {
      title: "New Leads",
      value: stats.newLeads,
    },
    {
      title: "Assigned Leads",
      value: stats.assignedLeads,
    },
    {
      title: "Unassigned Leads",
      value: stats.unassignedLeads,
    },
    {
      title: "Sales",
      value: stats.sales,
    },
    {
      title: "Today's Callbacks",
      value: stats.callbacksToday,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="text-gray-500">
            Welcome to FutureCrest Energy CRM
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">
                {card.title}
              </p>

              <h2 className="mt-2 text-4xl font-bold text-blue-700">
                {card.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-white shadow">
          <div className="border-b px-6 py-4">
            <h2 className="font-semibold">
              Recent Leads
            </h2>
          </div>

          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-5 py-3 text-left">
                  Lead ID
                </th>

                <th className="px-5 py-3 text-left">
                  Customer
                </th>

                <th className="px-5 py-3 text-left">
                  Assigned Agent
                </th>

                <th className="px-5 py-3 text-left">
                  Status
                </th>

                <th className="px-5 py-3 text-left">
                  Created
                </th>

                <th className="px-5 py-3 text-center">
                  View
                </th>
              </tr>
            </thead>

            <tbody>
              {stats.recentLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-medium">
                    {lead.lead_id}
                  </td>

                  <td className="px-5 py-4">
                    {lead.customer_name}
                  </td>

                  <td className="px-5 py-4">
                    {lead.agent
                      ? `${lead.agent.employee_id} • ${lead.agent.full_name}`
                      : "Unassigned"}
                  </td>

                  <td className="px-5 py-4">
                    {lead.status}
                  </td>

                  <td className="px-5 py-4">
                    {lead.created_at
                      ? new Date(
                          lead.created_at
                        ).toLocaleDateString("en-AU")
                      : "-"}
                  </td>

                  <td className="px-5 py-4 text-center">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}