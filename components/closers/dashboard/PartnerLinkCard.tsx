"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

export default function PartnerLinkCard({ partnerCode }: { partnerCode: string }) {
  const [copied, setCopied] = useState(false);

  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/submit?partner=${partnerCode}`
      : `/submit?partner=${partnerCode}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Unable to copy automatically. Please copy the link manually.");
    }
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        Your lead submission link
      </p>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="flex-1 truncate rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-slate-700">
          {link}
        </code>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>

          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
          >
            <ExternalLink size={14} />
            Open
          </a>
        </div>
      </div>

      <p className="mt-2 text-xs text-blue-600">
        Share this link with your team so their submissions are tracked under your channel.
      </p>
    </div>
  );
}
