"use client";

import { useEffect, useState } from "react";
import { getActiveAgents } from "@/lib/agents";
import { assignLead } from "@/lib/assignments";

interface Props {
  leadId: number;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

interface Agent {
  id: string;
  employee_id: string;
  username: string;
  full_name: string;
}

export default function AssignAgentModal({
  leadId,
  open,
  onClose,
  onAssigned,
}: Props) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function loadAgents() {
      const data = await getActiveAgents();
      setAgents(data as Agent[]);
    }

    loadAgents();
  }, [open]);

  async function handleAssign() {
    if (!selectedAgent) {
      alert("Please select an agent.");
      return;
    }

    try {
      setLoading(true);

      await assignLead(leadId, selectedAgent);

      alert("Lead assigned successfully.");

      onAssigned();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to assign lead.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

        <h2 className="mb-5 text-2xl font-bold">
          Assign Lead
        </h2>

        <p className="mb-4 text-sm text-slate-500">
          Lead ID: {leadId}
        </p>

        <select
          className="w-full rounded-lg border p-3"
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
        >
          <option value="">Select Agent</option>

          {agents.map((agent) => (
            <option
  key={agent.id}
  value={agent.id}
>
  {agent.employee_id} • {agent.username} • {agent.full_name}
</option>
          ))}
        </select>

        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-lg border px-5 py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleAssign}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>

        </div>

      </div>

    </div>
  );
}