"use client";

import { useState, useEffect } from "react";
import { getActiveAgents } from "@/lib/agents";
import { bulkAssignLeads } from "@/lib/bulkAssignment";
import { Users } from "lucide-react";

interface Props {
  selectedLeadIds: (string | number)[];
  onAssigned: () => void;
  onClearSelection: () => void;
}

export default function BulkAssignBar({
  selectedLeadIds,
  onAssigned,
  onClearSelection,
}: Props) {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAgents() {
      const data = await getActiveAgents();
      setAgents(data || []);
    }
    loadAgents();
  }, []);

  if (selectedLeadIds.length === 0) return null;

  async function handleBulkAssign() {
    if (!selectedAgentId) {
      alert("Please select an agent to assign the leads to.");
      return;
    }

    try {
      setLoading(true);
      await bulkAssignLeads(selectedLeadIds, selectedAgentId);
      alert(`Successfully assigned ${selectedLeadIds.length} leads.`);
      setSelectedAgentId("");
      onClearSelection();
      onAssigned();
    } catch (error: any) {
      alert(error.message || "Failed to bulk assign leads.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-2xl bg-slate-900 px-6 py-3 text-white shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Users size={18} className="text-blue-400" />
        <span>{selectedLeadIds.length} lead(s) selected</span>
      </div>

      <div className="h-5 w-px bg-slate-700" />

      <select
        value={selectedAgentId}
        onChange={(e) => setSelectedAgentId(e.target.value)}
        className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
      >
        <option value="">-- Choose Agent --</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.full_name} ({agent.employee_id || agent.username})
          </option>
        ))}
      </select>

      <button
        onClick={handleBulkAssign}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
      >
        {loading ? "Assigning..." : "Assign Selected"}
      </button>

      <button
        onClick={onClearSelection}
        className="text-sm text-slate-400 hover:text-white transition"
      >
        Cancel
      </button>
    </div>
  );
}