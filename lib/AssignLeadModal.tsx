"use client";

import { useEffect, useState } from "react";
import { getActiveAgents } from "@/lib/agents";
import { assignLead } from "@/lib/assignments";

interface Props {
  leadId: number;
  isOpen: boolean;
  onClose: () => void;
  onAssigned?: () => void;
}

export default function AssignLeadModal({
  leadId,
  isOpen,
  onClose,
  onAssigned,
}: Props) {
  const [agents, setAgents] = useState<any[]>([]);
  const [agentId, setAgentId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAgents() {
      const data = await getActiveAgents();
      setAgents(data);
    }

    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);

  async function handleAssign() {
    if (!agentId) {
      alert("Please select an agent.");
      return;
    }

    try {
      setLoading(true);

      await assignLead(leadId, agentId);

      alert("Lead assigned successfully.");

      onAssigned?.();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

        <h2 className="mb-5 text-2xl font-bold">
          Assign Lead
        </h2>

        <select
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          className="w-full rounded-lg border p-3"
        >
          <option value="">Select Agent</option>

          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.full_name}
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
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            {loading ? "Assigning..." : "Assign"}
          </button>

        </div>

      </div>

    </div>
  );
}