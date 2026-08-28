'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  leadId: number;
  open: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export default function AssignAgentModal({ leadId, open, onClose, onAssigned }: Props) {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch active agents for the dropdown
  useEffect(() => {
    async function fetchAgents() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, employee_id')
        .eq('role', 'Agent')
        .eq('status', 'Active');
      if (data) setAgents(data);
    }
    fetchAgents();
  }, []);

  // Do not render the modal if it's not open
  if (!open) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Call your new secure server endpoint
      const response = await fetch(`/api/leads/${leadId}/assignment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          notes: notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to assign agent');
      }

      onAssigned(); // Refresh the table
      onClose(); // Close the modal
      
      // Reset form state
      setSelectedAgentId('');
      setNotes('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Assign Agent</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleAssign}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Agent</label>
            <select
              required
              className="w-full border border-gray-300 rounded p-2"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
            >
              <option value="" disabled>Select an agent...</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.employee_id} - {agent.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Notes (Optional)</label>
            <textarea
              className="w-full border border-gray-300 rounded p-2"
              rows={3}
              placeholder="E.g., High priority lead, follow up immediately."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading || !selectedAgentId}
            >
              {isLoading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}