"use client";

import { useEffect, useState } from "react";
import { getClosers } from "@/lib/closers";

interface Props {
  leadId: number;
  open: boolean;
  currentUserId: string;
  onClose: () => void;
  onApproved: () => void;
}

interface Closer {
  id: string;
  employee_id: string;
  username: string;
  full_name: string;
}

export default function ApproveLeadModal({
  leadId,
  open,
  currentUserId,
  onClose,
  onApproved,
}: Props) {
  const [closers, setClosers] = useState<Closer[]>([]);
  const [selectedCloser, setSelectedCloser] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    async function loadClosers() {
      const data = await getClosers();
      setClosers(data as Closer[]);
    }

    loadClosers();
  }, [open]);

  async function handleApprove() {
    if (!selectedCloser) {
      alert("Please select a closer.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/leads/${leadId}/approval`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve",
          closerId: selectedCloser,
          userId: currentUserId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error);
      }

      alert("Lead approved successfully.");

      onApproved();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Approval failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

        <h2 className="mb-5 text-2xl font-bold">
          Approve Lead
        </h2>

        <p className="mb-4 text-sm text-slate-500">
          Lead ID: {leadId}
        </p>

        <select
          className="w-full rounded-lg border p-3"
          value={selectedCloser}
          onChange={(e) => setSelectedCloser(e.target.value)}
        >
          <option value="">Select Closer</option>

          {closers.map((closer) => (
            <option
              key={closer.id}
              value={closer.id}
            >
              {closer.employee_id} • {closer.username} • {closer.full_name}
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
            onClick={handleApprove}
            disabled={loading}
            className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Approving..." : "Approve"}
          </button>

        </div>

      </div>
    </div>
  );
}