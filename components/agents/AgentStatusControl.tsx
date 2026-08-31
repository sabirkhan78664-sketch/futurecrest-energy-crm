"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  status: string;
}

const STATUS_OPTIONS = ["Active", "Suspended", "Inactive"];

// Same POST /api/users/status contract already used on the Users page —
// restricted to Super Admin there, no backend change needed here.
export default function AgentStatusControl({ userId, status }: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function updateStatus(newStatus: string) {
    if (newStatus === status) return;

    try {
      setUpdating(true);

      const res = await fetch("/api/users/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
          status: newStatus,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.message || "Failed to update status.");
        return;
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <select
      value={status}
      disabled={updating}
      onChange={(e) => updateStatus(e.target.value)}
      className="rounded-lg border border-gray-300 px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
