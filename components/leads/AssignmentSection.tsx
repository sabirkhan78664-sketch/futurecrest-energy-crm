interface AssignmentSectionProps {
  agents: any[];
  closers: any[];

  assignedAgent: string;
  setAssignedAgent: (value: string) => void;

  assignedCloser: string;
  setAssignedCloser: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;

  isAgent: boolean;
}

export default function AssignmentSection({
  agents,
  closers,
  assignedAgent,
  setAssignedAgent,
  assignedCloser,
  setAssignedCloser,
  status,
  setStatus,
  isAgent,
}: AssignmentSectionProps) {
  return (
    <section>
      <h2 className="mb-6 text-lg font-semibold">
        Assignment & Status
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

        {/* Assigned Agent */}

        <div>
          <label className="mb-2 block">
            Assigned Agent
          </label>

          <select
            value={assignedAgent}
            onChange={(e) => setAssignedAgent(e.target.value)}
            disabled={isAgent}
            className="h-11 w-full rounded-xl border px-4 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Select Agent</option>

            {agents.map((agent) => (
              <option
                key={agent.id}
                value={agent.id}
              >
                {agent.full_name}
              </option>
            ))}
          </select>

          {isAgent && (
            <p className="mt-1 text-xs text-slate-500">
              Agent assignment is automatic.
            </p>
          )}
        </div>

        {/* Assigned Closer */}

        <div>
          <label className="mb-2 block">
            Assigned Closer
          </label>

          <select
            value={assignedCloser}
            onChange={(e) => setAssignedCloser(e.target.value)}
            disabled={isAgent}
            className="h-11 w-full rounded-xl border px-4 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">
              Select Closer
            </option>

            {closers.map((closer) => (
              <option
                key={closer.id}
                value={closer.id}
              >
                {closer.full_name}
              </option>
            ))}
          </select>

          {isAgent && (
            <p className="mt-1 text-xs text-slate-500">
              A closer will be assigned after approval.
            </p>
          )}
        </div>

        {/* Lead Status */}

        <div>
          <label className="mb-2 block">
            Lead Status
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={isAgent}
            className="h-11 w-full rounded-xl border px-4 disabled:bg-slate-100 disabled:text-slate-500"
          >
            {isAgent ? (
              <option>Pending Approval</option>
            ) : (
              <>
                <option>Callback</option>
                <option>Sale</option>
                <option>Rejected</option>
                <option>Lost</option>
              </>
            )}
          </select>

          {isAgent && (
            <p className="mt-1 text-xs text-slate-500">
              Status will change after admin review.
            </p>
          )}
        </div>

      </div>
    </section>
  );
}