"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

interface QASectionProps {
  leadId: string;
  currentStatus: string;
  currentQaStatus?: string | null;
  currentUser: { id: string; full_name: string; role: string };
}

export default function QASection({
  leadId,
  currentStatus,
  currentQaStatus,
  currentUser,
}: QASectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qaComments, setQaComments] = useState("");

  if (currentStatus !== "Sold") {
    return null;
  }

  const qaStatus = currentQaStatus || "Not Audited";
  const alreadyAudited =
    qaStatus === "Approved" || qaStatus === "Rejected";

  const handleQAAction = async (action: "Approved" | "Rejected") => {
    if (action === "Rejected" && !qaComments.trim()) {
      alert("Please provide a reason/comment for rejection.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/leads/${leadId}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          notes: qaComments.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result?.message || "Unable to complete QA audit.");
        return;
      }

      window.location.href =
        action === "Rejected"
          ? "/qa?filter=rejected"
          : "/qa?filter=approved";
    } catch (error: any) {
      alert(error?.message || "Unable to complete QA audit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-blue-600" size={22} />
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Post-Sale QA Audit
            </h3>
            <p className="text-sm text-slate-500">
              QA audit is available only because this lead is Sold.
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            qaStatus === "Approved"
              ? "bg-green-100 text-green-700"
              : qaStatus === "Rejected"
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {qaStatus}
        </span>
      </div>

      {alreadyAudited ? (
        <div
          className={`rounded-lg p-4 text-sm font-medium ${
            qaStatus === "Approved"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          This Sold lead has already been audited by QA.
        </div>
      ) : (
        <>
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <strong>Audit is optional.</strong> QA can audit this Sold lead
            when required for a spot check, complaint, compliance review, or
            client request.
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              QA Feedback / Notes
            </label>
            <textarea
              rows={4}
              placeholder="Enter audit notes or rejection reason..."
              value={qaComments}
              onChange={(e) => setQaComments(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => handleQAAction("Rejected")}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle size={16} />
              Reject QA
            </button>

            <button
              onClick={() => handleQAAction("Approved")}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              Approve QA
            </button>
          </div>
        </>
      )}

      <p className="text-xs text-slate-400">
        Logged-in QA user: {currentUser.full_name || currentUser.role}
      </p>
    </div>
  );
}
