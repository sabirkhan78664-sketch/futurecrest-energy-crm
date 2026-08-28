"use client";

import { useState } from "react";

interface Props {
  leadId: number;
  open: boolean;
  currentUserId: string;
  onClose: () => void;
  onRejected: () => void;
}

export default function RejectLeadModal({
  leadId,
  open,
  currentUserId,
  onClose,
  onRejected,
}: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleReject() {
    if (!reason.trim()) {
      alert("Please enter a rejection reason.");
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
          action: "reject",
          reason,
          userId: currentUserId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to reject lead.");
      }

      alert("Lead rejected successfully.");

      setReason("");
      onRejected();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

        <h2 className="mb-5 text-2xl font-bold">
          Reject Lead
        </h2>

        <p className="mb-4 text-sm text-slate-500">
          Lead ID: {leadId}
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter rejection reason..."
          rows={5}
          className="w-full rounded-lg border p-3"
        />

        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-lg border px-5 py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleReject}
            disabled={loading}
            className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Rejecting..." : "Reject"}
          </button>

        </div>

      </div>
    </div>
  );
}