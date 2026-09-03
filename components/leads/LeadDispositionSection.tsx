"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  CheckCircle,
  ThumbsUp,
  Clock3,
  PhoneMissed,
  PhoneCall,
  XCircle,
  ShieldOff,
  Ban,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
  Users,
} from "lucide-react";

type Outcome =
  | "Sold"
  | "Interested"
  | "Processing"
  | "Follow-up"
  | "Lost"
  | "No Answer"
  | "Internal DNC"
  | "NGTG"
  | "";

interface DispositionLeadPerson {
  full_name?: string | null;
  employee_id?: string | null;
  username?: string | null;
}

interface DispositionLead {
  id: number;
  status?: string | null;
  callback_date?: string | null;
  callback_time?: string | null;
  cl_id?: string | null;
  channel_name?: string | null;
  offered_retailer?: string | null;
  fuel_type?: string | null;
  campaign?: string | null;
  comments?: string | null;
  agent?: DispositionLeadPerson | null;
  assignedAgent?: DispositionLeadPerson | null;
  // Text-only fallback for Channel Partner submissions, which have no
  // profile-linked creator (see app/api/partner/submit/route.ts).
  agent_name?: string | null;
  creator?: DispositionLeadPerson | null;
  closer?: DispositionLeadPerson | null;
}

interface LeadDispositionSectionProps {
  // The full lead record (same shape getLead()/LeadForm's initialData
  // already carries) — only the fields this section actually reads are
  // typed here. The parent renders this component for any Admin/Super
  // Admin regardless of ownership; isLeadOwner below just picks the
  // right banner text.
  lead: DispositionLead;
  // True when the current user is this lead's assigned_closer. Admin/
  // Super Admin can process a lead they don't own too — this only
  // changes which explanatory message is shown, not what's allowed.
  isLeadOwner?: boolean;
}

/* ============================================================
   PERSON SUMMARY (Current Agent / Current Lead Owner)
============================================================ */

function PersonSummary({
  label,
  person,
}: {
  label: string;
  person?: {
    full_name?: string | null;
    employee_id?: string | null;
  } | null;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {person?.full_name || "-"}
      </p>

      {person?.employee_id && (
        <p className="text-xs text-slate-500">
          {person.employee_id}
        </p>
      )}
    </div>
  );
}

/* ============================================================
   OUTCOME BUTTON
============================================================ */

function OutcomeButton({
  selected,
  onClick,
  icon,
  label,
  color,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  color:
    | "green"
    | "teal"
    | "cyan"
    | "amber"
    | "orange"
    | "red"
    | "rose"
    | "slate";
}) {
  const styles = {
    green: {
      border: "border-emerald-300",
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
      title: "text-emerald-700",
      ring: "ring-emerald-200",
    },
    teal: {
      border: "border-teal-300",
      bg: "bg-teal-50",
      icon: "bg-teal-100 text-teal-600",
      title: "text-teal-700",
      ring: "ring-teal-200",
    },
    cyan: {
      border: "border-cyan-300",
      bg: "bg-cyan-50",
      icon: "bg-cyan-100 text-cyan-600",
      title: "text-cyan-700",
      ring: "ring-cyan-200",
    },
    amber: {
      border: "border-amber-300",
      bg: "bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
      title: "text-amber-700",
      ring: "ring-amber-200",
    },
    orange: {
      border: "border-orange-300",
      bg: "bg-orange-50",
      icon: "bg-orange-100 text-orange-600",
      title: "text-orange-700",
      ring: "ring-orange-200",
    },
    red: {
      border: "border-red-300",
      bg: "bg-red-50",
      icon: "bg-red-100 text-red-600",
      title: "text-red-700",
      ring: "ring-red-200",
    },
    rose: {
      border: "border-rose-400",
      bg: "bg-rose-50",
      icon: "bg-rose-200 text-rose-800",
      title: "text-rose-800",
      ring: "ring-rose-300",
    },
    slate: {
      border: "border-slate-300",
      bg: "bg-slate-50",
      icon: "bg-slate-200 text-slate-700",
      title: "text-slate-700",
      ring: "ring-slate-300",
    },
  };

  const s = styles[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${s.border} ${s.bg} ${
        selected ? `ring-2 ${s.ring}` : ""
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${s.icon}`}
      >
        {icon}
      </span>

      <span className={`text-sm font-semibold ${s.title}`}>
        {label}
      </span>
    </button>
  );
}

/* ============================================================
   LEAD DISPOSITION SECTION
============================================================ */

export default function LeadDispositionSection({
  lead,
  isLeadOwner = false,
}: LeadDispositionSectionProps) {
  const router = useRouter();

  const isClosed =
    lead.status === "Sold" || lead.status === "Lost";

  const [outcome, setOutcome] = useState<Outcome>("");

  const [callbackDate, setCallbackDate] = useState(
    lead.callback_date || ""
  );

  const [callbackTime, setCallbackTime] = useState(
    lead.callback_time || ""
  );

  const [clId, setClId] = useState(lead.cl_id || "");

  const [channelName, setChannelName] = useState(
    lead.channel_name || ""
  );

  const [offeredRetailer, setOfferedRetailer] = useState(
    lead.offered_retailer || ""
  );

  const [fuelType, setFuelType] = useState(
    lead.fuel_type || ""
  );

  const [dispositionCampaign, setDispositionCampaign] = useState(
    lead.campaign || ""
  );

  const [comments, setComments] = useState(lead.comments || "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Same priority as the Agent column elsewhere (e.g. LeadTable.tsx):
  // creator (created_by) first, then the assigned_agent FK embed, then
  // the plain-text agent_name Channel Partner submissions use instead
  // of a profile-linked creator.
  const agent =
    lead.creator ||
    lead.agent ||
    lead.assignedAgent ||
    (lead.agent_name ? { full_name: lead.agent_name } : null);

  const owner = lead.closer || null;

  async function submitOutcome() {
    if (!outcome) {
      alert("Please select an outcome.");
      return;
    }

    if (outcome === "Follow-up") {
      if (!callbackDate) {
        alert("Please select follow-up date.");
        return;
      }

      if (!callbackTime) {
        alert("Please select follow-up time.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/closer/sales/${lead.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "outcome",

            outcome,

            callback_date:
              outcome === "Follow-up" ? callbackDate : null,

            callback_time:
              outcome === "Follow-up" ? callbackTime : null,

            comments,

            cl_id: clId?.trim() || null,

            channel_name: channelName?.trim() || null,

            ...(outcome === "Sold"
              ? {
                  offered_retailer:
                    offeredRetailer?.trim() || null,
                  fuel_type: fuelType?.trim() || null,
                  campaign: dispositionCampaign?.trim() || null,
                }
              : {}),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to submit outcome."
        );
      }

      setSuccess(`Lead successfully marked as ${outcome}.`);
      setOutcome("");

      if (outcome !== "Follow-up") {
        setCallbackDate("");
        setCallbackTime("");
      }

      router.refresh();
    } catch (err) {
      console.error("Disposition submit error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit outcome."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">

      {/* =====================================================
          CURRENT LEAD TEAM
      ===================================================== */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Users size={20} />
          </div>

          <h2 className="text-lg font-bold text-slate-800">
            Current Lead Team
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PersonSummary label="Current Agent" person={agent} />
          <PersonSummary label="Current Lead Owner" person={owner} />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          <CheckCircle size={16} />
          {isLeadOwner
            ? "Taken by you — you can process this lead."
            : "You have Admin/Super Admin access to process this lead."}
        </div>

      </section>

      {/* =====================================================
          LEAD DISPOSITION
      ===================================================== */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-800">
            Lead Disposition
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select the outcome for this lead.
          </p>
        </div>

        {/*
          This section only ever renders for Admin/Super Admin — the
          parent (LeadForm) gates it on canProcessLead, which already
          requires that role. Closer processes leads through their own
          separate page (app/closer/sales/[id]/page.tsx) and never
          reaches this component, so unlike that page, a closed lead
          here doesn't block re-selecting an outcome — Admin/Super Admin
          can reopen it. The server enforces the same Admin/Super
          Admin-only exception (app/api/closer/sales/[id]/route.ts).
        */}
        <>
            {isClosed && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertCircle size={18} className="shrink-0 text-amber-500" />
                This lead is currently closed as{" "}
                <strong className="font-semibold">{lead.status}</strong>.
                Selecting and saving a new outcome below will reopen it.
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                <CheckCircle size={16} />
                {success}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <OutcomeButton
                selected={outcome === "Sold"}
                onClick={() => setOutcome("Sold")}
                icon={<CheckCircle size={16} />}
                label="Sold"
                color="green"
              />

              <OutcomeButton
                selected={outcome === "Interested"}
                onClick={() => setOutcome("Interested")}
                icon={<ThumbsUp size={16} />}
                label="Interested"
                color="teal"
              />

              <OutcomeButton
                selected={outcome === "Processing"}
                onClick={() => setOutcome("Processing")}
                icon={<Clock3 size={16} />}
                label="Processing"
                color="cyan"
              />

              <OutcomeButton
                selected={outcome === "No Answer"}
                onClick={() => setOutcome("No Answer")}
                icon={<PhoneMissed size={16} />}
                label="No Answer"
                color="amber"
              />

              <OutcomeButton
                selected={outcome === "Follow-up"}
                onClick={() => setOutcome("Follow-up")}
                icon={<PhoneCall size={16} />}
                label="Follow-up"
                color="orange"
              />

              <OutcomeButton
                selected={outcome === "Lost"}
                onClick={() => setOutcome("Lost")}
                icon={<XCircle size={16} />}
                label="Lost"
                color="red"
              />

              <OutcomeButton
                selected={outcome === "Internal DNC"}
                onClick={() => setOutcome("Internal DNC")}
                icon={<ShieldOff size={16} />}
                label="Internal DNC"
                color="rose"
              />

              <OutcomeButton
                selected={outcome === "NGTG"}
                onClick={() => setOutcome("NGTG")}
                icon={<Ban size={16} />}
                label="NGTG"
                color="slate"
              />
            </div>

            {/* CLIENT ID / CHANNEL NAME */}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Client Lead ID
                </label>

                <input
                  type="text"
                  value={clId}
                  onChange={(e) => setClId(e.target.value)}
                  placeholder="Enter client lead ID"
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Channel Name
                </label>

                <select
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select channel</option>
                  <option value="Mango">Mango</option>
                  <option value="Umbrella">Umbrella</option>
                  <option value="Brother">Brother</option>
                </select>
              </div>
            </div>

            {/* SOLD */}

            {outcome === "Sold" && (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <h3 className="text-sm font-bold text-emerald-800">
                  Sale Details
                </h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Final Retailer
                    </label>

                    <input
                      type="text"
                      value={offeredRetailer}
                      onChange={(e) =>
                        setOfferedRetailer(e.target.value)
                      }
                      placeholder="Enter final retailer"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Fuel Type
                    </label>

                    <input
                      type="text"
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      placeholder="Enter fuel type"
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Campaign
                  </label>

                  <input
                    type="text"
                    value={dispositionCampaign}
                    onChange={(e) =>
                      setDispositionCampaign(e.target.value)
                    }
                    placeholder="Enter campaign"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>
            )}

            {/* FOLLOW-UP */}

            {outcome === "Follow-up" && (
              <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-orange-800">
                  <Calendar size={16} />
                  Follow-up Schedule
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Follow-up Date *
                    </label>

                    <input
                      type="date"
                      value={callbackDate}
                      onChange={(e) => setCallbackDate(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Follow-up Time *
                    </label>

                    <input
                      type="time"
                      value={callbackTime}
                      onChange={(e) => setCallbackTime(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* COMMENTS */}

            {outcome && (
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Comments
                </label>

                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Add important notes about the outcome..."
                  className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <div className="mt-1 text-right text-xs text-slate-400">
                  {comments.length}/500
                </div>
              </div>
            )}

            {/* SUBMIT */}

            <div className="mt-6">
              <button
                type="button"
                onClick={submitOutcome}
                disabled={!outcome || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Disposition
                    {outcome ? ` — ${outcome}` : ""}
                  </>
                )}
              </button>
            </div>
        </>

      </section>

    </div>
  );
}
