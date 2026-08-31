import MainLayout from "@/components/layout/MainLayout";
import { requireRole } from "@/lib/auth";
import { getAgents } from "@/lib/agents";
import Link from "next/link";
import AgentStatusControl from "@/components/agents/AgentStatusControl";
import DeleteAgentButton from "@/components/agents/DeleteAgentButton";

export default async function AgentsListPage() {
  // Managing the agent roster is for Admin/Super Admin only.
  await requireRole(["Admin", "Super Admin"]);

  const agents = await getAgents();

  return (
    <MainLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agents</h1>
            <p className="text-slate-500">
              Manage FutureCrest Energy agents
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Employee ID</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Username</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-400"
                  >
                    No agents found.
                  </td>
                </tr>
              )}

              {agents.map((agent: any) => (
                <tr
                  key={agent.id}
                  className="border-t hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {agent.employee_id ?? "-"}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {agent.full_name ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    {agent.username ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    {agent.status ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <AgentStatusControl
                        userId={agent.id}
                        status={agent.status ?? "Active"}
                      />

                      <DeleteAgentButton
                        userId={agent.id}
                        agentName={agent.full_name}
                      />
                    </div>
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
