"use client";

import { useState } from "react";

interface Props {
  open: boolean;
  leadId: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddFollowupModal({
  open,
  leadId,
  onClose,
  onSaved,
}: Props) {
  const [followupDate, setFollowupDate] = useState("");
  const [followupTime, setFollowupTime] = useState("");
  const [callbackType, setCallbackType] = useState("Call");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSave() {
    try {
      setLoading(true);

      const res = await fetch("/api/followups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead_id: leadId,
          followup_date: followupDate,
          followup_time: followupTime,
          callback_type: callbackType,
          notes,
          status: "Pending",
        }),
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.message);
        return;
      }

      alert("Follow-up created successfully.");

      onSaved();
      onClose();

    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">

        <h2 className="mb-6 text-2xl font-bold">
          Add Follow-up
        </h2>

        <div className="space-y-4">

          <input
            type="date"
            value={followupDate}
            onChange={(e) => setFollowupDate(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <input
            type="time"
            value={followupTime}
            onChange={(e) => setFollowupTime(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <select
            value={callbackType}
            onChange={(e) => setCallbackType(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option>Call</option>
            <option>Email</option>
            <option>SMS</option>
            <option>WhatsApp</option>
          </select>

          <textarea
            rows={5}
            placeholder="Follow-up Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

        </div>

        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="rounded-lg border px-5 py-2"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Follow-up"}
          </button>

        </div>

      </div>
    </div>
  );
}