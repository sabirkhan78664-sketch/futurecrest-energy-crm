import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { getAgents } from "@/lib/agents";

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <MainLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Agent Management
            </h1>

            <p className="text-slate-500">
              Manage FutureCrest CRM Agents
            </p>
          </div>

          <Link
            href="/agents/new"
            className="rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            + Add Agent
          </Link>

        </div>

        <div className="overflow-x-auto rounded-xl border bg-white shadow">

          <table className="min-w-full">

            <thead className="bg-slate-100">

              <tr>
                <th className="px-5 py-4 text-left">
                  Employee ID
                </th>

                <th className="px-5 py-4 text-left">
                  Username
                </th>

                <th className="px-5 py-4 text-left">
                  Name
                </th>

                <th className="px-5 py-4 text-center">
                  Role
                </th>

                <th className="px-5 py-4 text-center">
                  Status
                </th>

                <th className="px-5 py-4 text-center">
                  Assigned Leads
                </th>

                <th className="px-5 py-4 text-center">
                  Sales
                </th>

                <th className="px-5 py-4 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {agents.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-500"
                  >
                    No agents available.
                  </td>

                </tr>

              ) : (

                agents.map((agent: any) => (

                  <tr
                    key={agent.id}
                    className="border-t hover:bg-slate-50"
                  >

                    <td className="px-5 py-4 font-semibold">
                      {agent.employee_id}
                    </td>

                    <td className="px-5 py-4">
                      {agent.username}
                    </td>

                    <td className="px-5 py-4">
                      {agent.full_name}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {agent.role}
                    </td>

                    <td className="px-5 py-4 text-center">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          agent.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {agent.status}
                      </span>

                    </td>

                    <td className="px-5 py-4 text-center">
                      {agent.assigned_leads ?? 0}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {agent.sales ?? 0}
                    </td>

                    <td className="px-5 py-4">

                      <div className="flex justify-center gap-4">

                        <Link
                          href={`/agents/${agent.id}`}
                          className="text-green-600 hover:underline"
                        >
                          View
                        </Link>

                        <Link
                          href={`/agents/${agent.id}/edit`}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </Link>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>
    </MainLayout>
  );
}