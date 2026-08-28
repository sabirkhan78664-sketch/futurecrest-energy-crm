type Agent = {
  employee_id?: string;
  full_name: string;
  leads: number;
};

interface Props {
  agents: Agent[];
}

export default function TopAgentPerformance({ agents }: Props) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow">
      <h2 className="mb-6 text-xl font-bold">
        🏆 Top Agent Performance
      </h2>

      {agents.length === 0 ? (
        <p className="text-gray-500">
          No agent performance data available.
        </p>
      ) : (
        <div className="space-y-4">
          {agents.map((agent, index) => (
            <div
              key={agent.employee_id || agent.full_name}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-semibold">
                  #{index + 1} {agent.full_name}
                </p>

                {agent.employee_id && (
                  <p className="text-sm text-gray-500">
                    {agent.employee_id}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {agent.leads}
                </p>

                <p className="text-sm text-gray-500">
                  Leads
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
