"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  leadId: number;
  className?: string;
}

export default function TakeLeadButton({
  leadId,
  className,
}: Props) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);

  async function handleTakeLead() {
    if (claiming) return;

    try {
      setClaiming(true);

      const res = await fetch(`/api/leads/${leadId}/claim`, {
        method: "POST",
      });

      const result = await res.json();

      if (!result.success) {
        alert(
          result.message || "Unable to claim this lead."
        );
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("Take Lead error:", err);
      alert("Something went wrong.");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleTakeLead}
      disabled={claiming}
      title="Claim this lead as your own"
      className={
        className ||
        "rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {claiming ? "Claiming..." : "Take Lead"}
    </button>
  );
}
