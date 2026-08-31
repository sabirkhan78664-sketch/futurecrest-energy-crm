"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface Props {
  userId: string;
  agentName?: string;
  redirectTo?: string;
}

// Same DELETE /api/users/[id] already used elsewhere — restricted to
// Super Admin, blocks self-delete — no backend change needed here.
export default function DeleteAgentButton({
  userId,
  agentName,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete ${
        agentName || "this agent"
      }? This permanently removes their account and cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!result.success) {
        alert(result.message || "Failed to delete agent.");
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 size={15} />
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
