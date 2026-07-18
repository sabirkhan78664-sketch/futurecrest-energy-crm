"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddFollowupModal from "./AddFollowupModal";
import FollowupTimeline from "./FollowupTimeline";

interface Props {
  leadId: number;
  followups: any[];
}

export default function LeadFollowups({
  leadId,
  followups,
}: Props) {
  const [open, setOpen] = useState(false);

  const router = useRouter();

  return (
    <>
      <div className="rounded-xl border bg-white p-6 shadow">

        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-xl font-bold">
            Follow-up Timeline
          </h2>

          <button
            onClick={() => setOpen(true)}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
          >
            + Add Follow-up
          </button>

        </div>

        <FollowupTimeline
          followups={followups}
        />

      </div>

      <AddFollowupModal
        open={open}
        leadId={leadId}
        onClose={() => setOpen(false)}
        onSaved={() => router.refresh()}
      />
    </>
  );
}