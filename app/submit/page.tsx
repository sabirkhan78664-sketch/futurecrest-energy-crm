"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import LeadForm from "@/components/leads/LeadForm";

type Status = "idle" | "success" | "duplicate" | "error";
type PartnerCheck = "checking" | "valid" | "invalid";

function buildDuplicateMessage(duplicateBy: string[] | undefined) {
  if (!duplicateBy || duplicateBy.length === 0) {
    return "A lead with these details already exists.";
  }

  if (duplicateBy.includes("Mobile Number")) {
    return "A lead with this mobile number already exists.";
  }

  if (duplicateBy.includes("NMI")) {
    return "A lead with this NMI already exists.";
  }

  return "A lead with these details already exists.";
}

function SubmitFormContent() {
  const searchParams = useSearchParams();
  const partnerCode = (searchParams.get("partner") || "").trim();

  const [partnerCheck, setPartnerCheck] = useState<PartnerCheck>("checking");

  useEffect(() => {
    if (!partnerCode) {
      setPartnerCheck("invalid");
      return;
    }

    let cancelled = false;
    setPartnerCheck("checking");

    fetch(`/api/partner/validate?partner=${encodeURIComponent(partnerCode)}`)
      .then((res) => res.json())
      .then((result) => {
        if (!cancelled) setPartnerCheck(result.valid ? "valid" : "invalid");
      })
      .catch(() => {
        if (!cancelled) setPartnerCheck("invalid");
      });

    return () => {
      cancelled = true;
    };
  }, [partnerCode]);

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const [successLeadId, setSuccessLeadId] = useState("");
  const [agentName, setAgentName] = useState("");

  async function handleSubmitOverride(payload: Record<string, any>) {
    if (!agentName.trim()) {
      alert("Agent name is required.");
      return;
    }

    setStatus("idle");
    setErrorMessage("");
    setDuplicateMessage("");

    try {
      const res = await fetch("/api/partner/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          partner_code: partnerCode,
          channel_name: partnerCode,
          agent_name: agentName,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (res.status === 409 && result.duplicate) {
        setStatus("duplicate");
        setDuplicateMessage(buildDuplicateMessage(result.duplicateBy));
        return;
      }

      if (!res.ok || !result.success) {
        setStatus("error");
        setErrorMessage(result.message || "Unable to submit lead.");
        return;
      }

      setStatus("success");
      setSuccessLeadId(result.lead_id || "");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  function handleSubmitAnother() {
    setStatus("idle");
    setErrorMessage("");
    setDuplicateMessage("");
    setSuccessLeadId("");
  }

  if (partnerCheck === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080f20]">
        <div className="text-sm text-slate-400">Checking your link…</div>
      </div>
    );
  }

  if (partnerCheck === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080f20] px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle size={28} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Invalid partner link
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            This lead submission link is missing a valid partner code.
            Please check the link you were given and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080f20] px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">

        {/* HEADER */}

        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-[60px] w-[180px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white px-2 shadow-sm">
              <Image
                src="/logo.jpg"
                alt="FutureCrest Solutions Pvt Ltd"
                width={240}
                height={70}
                className="h-auto w-full"
                priority
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-white">
                FutureCrest Energy CRM
              </h1>

              <p className="mt-1 text-sm text-slate-300">
                Lead submission portal
              </p>
            </div>
          </div>

          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            Partner: {partnerCode}
          </span>
        </div>

        {status === "success" ? (
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={26} />
              </div>

              <h2 className="text-lg font-bold text-emerald-800">
                Lead submitted successfully.
              </h2>

              <p className="mt-1 text-sm text-emerald-700">
                Reference:{" "}
                <span className="font-mono font-bold">{successLeadId}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleSubmitAnother}
              className="mt-6 h-11 w-full rounded-xl bg-blue-600 font-semibold text-white transition hover:bg-blue-700"
            >
              Submit Another Lead
            </button>
          </div>
        ) : (
          <>
            {status === "duplicate" && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{duplicateMessage}</span>
              </div>
            )}

            {status === "error" && errorMessage && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <LeadForm
              isEdit={false}
              hideAssignment={true}
              submitOverride={handleSubmitOverride}
              agentName={agentName}
              setAgentName={setAgentName}
            />
          </>
        )}

      </div>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#080f20]">
          <div className="text-sm text-slate-400">Loading…</div>
        </div>
      }
    >
      <SubmitFormContent />
    </Suspense>
  );
}
