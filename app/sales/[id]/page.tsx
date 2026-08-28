"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Phone,
  User,
  Loader2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

interface Lead {
  id: number;
  lead_id?: string | null;
  customer_name?: string | null;
  mobile?: string | null;
  alternate_mobile?: string | null;
  email?: string | null;
  address?: string | null;
  state?: string | null;
  postcode?: string | null;
  campaign?: string | null;
  fuel_type?: string | null;
  current_retailer?: string | null;
  status?: string | null;
  approval_status?: string | null;
}

export default function CloserSalesDetailPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [outcome, setOutcome] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!id) return;

    loadLead();
  }, [id]);

  async function loadLead() {
    try {
      setLoading(true);
      setError("");

      /*
       * First get the assignment.
       */
      const {
        data: assignment,
        error: assignmentError,
      } = await supabase
        .from("closer_assignments")
        .select("*")
        .eq("id", Number(id))
        .single();

      if (assignmentError) {
        console.error("Assignment error:", assignmentError);
        setError(assignmentError.message);
        return;
      }

      if (!assignment) {
        setError("Assigned lead was not found.");
        return;
      }

      /*
       * The assignment contains the lead ID.
       */
      const leadId = assignment.lead_id;

      if (!leadId) {
        setError("This assignment does not have a lead ID.");
        return;
      }

      /*
       * Load the actual lead.
       */
      const {
        data: leadData,
        error: leadError,
      } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (leadError) {
        console.error("Lead error:", leadError);
        setError(leadError.message);
        return;
      }

      setLead(leadData);
    } catch (err) {
      console.error("Load assigned lead error:", err);
      setError("Unable to load assigned lead.");
    } finally {
      setLoading(false);
    }
  }

  async function submitOutcome() {
    if (!lead) return;

    if (!outcome) {
      alert("Please select the final outcome.");
      return;
    }

    try {
      setSubmitting(true);

      /*
       * Update the assignment outcome.
       */
      const {
        error: updateError,
      } = await supabase
        .from("closer_assignments")
        .update({
          status: outcome,
          closer_comment: comment || null,
        })
        .eq("id", Number(id));

      if (updateError) {
        console.error("Outcome update error:", updateError);
        alert(updateError.message);
        return;
      }

      /*
       * Update the lead status as well.
       */
      const leadStatus =
        outcome === "Sold"
          ? "Sold"
          : outcome === "Callback"
          ? "Call Back"
          : "Lost";

      const {
        error: leadUpdateError,
      } = await supabase
        .from("leads")
        .update({
          status: leadStatus,
        })
        .eq("id", lead.id);

      if (leadUpdateError) {
        console.error(
          "Lead status update error:",
          leadUpdateError
        );

        alert(leadUpdateError.message);
        return;
      }

      alert(`Lead marked as ${outcome}.`);

      router.push("/closer/sales");
      router.refresh();
    } catch (err) {
      console.error("Submit outcome error:", err);
      alert("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="animate-spin" size={24} />
          Loading assigned lead...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-white p-8 shadow">
          <h1 className="text-xl font-bold text-red-600">
            Unable to load lead
          </h1>

          <p className="mt-3 text-slate-600">
            {error}
          </p>

          <Link
            href="/closer/sales"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
          >
            Back to Assigned Sales
          </Link>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
          <h1 className="text-xl font-bold">
            Lead not found
          </h1>

          <Link
            href="/closer/sales"
            className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 text-white"
          >
            Back to Assigned Sales
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/closer/sales"
              className="mb-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft size={16} />
              Back to Assigned Sales
            </Link>

            <h1 className="text-3xl font-bold text-slate-800">
              Process Assigned Lead
            </h1>

            <p className="mt-1 text-slate-500">
              Review the lead and submit the final outcome.
            </p>
          </div>
        </div>

        {/* Customer Information */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <User size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {lead.customer_name || "Unknown Customer"}
              </h2>

              <p className="text-sm text-slate-500">
                Lead ID: {lead.lead_id || lead.id}
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Mobile
              </p>

              <p className="mt-1 flex items-center gap-2 font-medium text-slate-800">
                <Phone size={16} />
                {lead.mobile || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Alternate Mobile
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {lead.alternate_mobile || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Email
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {lead.email || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Fuel Type
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {lead.fuel_type || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Current Retailer
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {lead.current_retailer || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Campaign
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {lead.campaign || "-"}
              </p>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Address
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {lead.address || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                State
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {lead.state || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Postcode
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {lead.postcode || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Current Status
              </p>

              <p className="mt-1 font-medium text-slate-800">
                {lead.status || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Final Outcome */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-800">
            Final Outcome
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            After speaking with the customer, select the final result.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <button
              type="button"
              onClick={() => setOutcome("Sold")}
              className={`rounded-xl border-2 p-5 text-left transition ${
                outcome === "Sold"
                  ? "border-green-500 bg-green-50"
                  : "border-slate-200 hover:border-green-400"
              }`}
            >
              <CheckCircle
                className="text-green-600"
                size={28}
              />

              <p className="mt-3 font-bold text-slate-800">
                Sold
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Customer completed the sale.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setOutcome("Callback")}
              className={`rounded-xl border-2 p-5 text-left transition ${
                outcome === "Callback"
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-200 hover:border-orange-400"
              }`}
            >
              <Phone
                className="text-orange-500"
                size={28}
              />

              <p className="mt-3 font-bold text-slate-800">
                Callback
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Customer needs a follow-up.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setOutcome("Lost")}
              className={`rounded-xl border-2 p-5 text-left transition ${
                outcome === "Lost"
                  ? "border-red-500 bg-red-50"
                  : "border-slate-200 hover:border-red-400"
              }`}
            >
              <XCircle
                className="text-red-600"
                size={28}
              />

              <p className="mt-3 font-bold text-slate-800">
                Lost
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Customer did not proceed.
              </p>
            </button>
          </div>

          {/* Comment */}
          <div className="mt-6">
            <label className="block text-sm font-semibold text-slate-700">
              Closer Comments
            </label>

            <textarea
              value={comment}
              onChange={(e) =>
                setComment(e.target.value)
              }
              rows={4}
              placeholder="Enter notes about the call or final outcome..."
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={submitOutcome}
              disabled={submitting || !outcome}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Final Outcome"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}