"use client";

interface DuplicateLeadModalProps {
  open: boolean;
  lead: any;
  // Whether the API's rules would actually accept an override from this
  // user for this specific duplicate — server-side stays the source of
  // truth regardless of what this shows.
  canOverride: boolean;
  // Agent and Closer can both create leads and hit this modal — either
  // one resubmitting a Sold duplicate gets the campaign-switch path
  // below instead of a dead end.
  canSwitchCampaign: boolean;
  reason: string;
  setReason: (value: string) => void;
  onClose: () => void;
  onOverride: () => void;
  onSwitchCampaign: (campaign: "PHI" | "NBN") => void;
}

export default function DuplicateLeadModal({
  open,
  lead,
  canOverride,
  canSwitchCampaign,
  reason,
  setReason,
  onClose,
  onOverride,
  onSwitchCampaign,
}: DuplicateLeadModalProps) {
  if (!open) return null;

  // Hitting a Sold duplicate isn't blocked outright for Agent/Closer —
  // they can still resubmit it under a different PHI or NBN campaign.
  // Offer that path directly instead of a dead-end message.
  const showCampaignSwitch =
    !canOverride &&
    canSwitchCampaign &&
    lead?.status === "Sold";

  const existingCampaign = String(lead?.campaign || "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

        <h2 className="text-xl font-bold text-red-600">
          Duplicate Lead Detected
        </h2>

        <div className="mt-5 space-y-3">

          <p>
            <strong>Lead ID:</strong> {lead?.lead_id}
          </p>

          <p>
            <strong>Customer:</strong> {lead?.customer_name}
          </p>

          <p>
            <strong>Status:</strong> {lead?.status}
          </p>
          <div className="mt-4">
  <strong>Duplicate By:</strong>

  <ul className="mt-2 list-disc list-inside text-red-600">
    {lead?.duplicateBy?.map((item: string) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
</div>

        </div>

        {!canOverride && !showCampaignSwitch && (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            This lead cannot be resubmitted right now.
          </p>
        )}

        {showCampaignSwitch && (
          <div className="mt-6 space-y-4">
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
              This lead is already sold under {existingCampaign || "its current campaign"}.
              You can resubmit it for a different campaign: PHI or NBN.
            </p>

            <div>
              <label className="block mb-2 font-medium">
                Reason for Override
              </label>

              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border rounded-lg p-3"
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              {existingCampaign !== "PHI" && (
                <button
                  onClick={() => onSwitchCampaign("PHI")}
                  className="flex-1 px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Switch to PHI &amp; Resubmit
                </button>
              )}

              {existingCampaign !== "NBN" && (
                <button
                  onClick={() => onSwitchCampaign("NBN")}
                  className="flex-1 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Switch to NBN &amp; Resubmit
                </button>
              )}
            </div>
          </div>
        )}

        {canOverride && (
          <div className="mt-6">
            <label className="block mb-2 font-medium">
              Reason for Override
            </label>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg p-3"
              rows={4}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-5 py-2 border rounded-lg"
          >
            Close
          </button>

          {canOverride && (
            <button
              onClick={onOverride}
              className="px-5 py-2 bg-red-600 text-white rounded-lg"
            >
              Override & Continue
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
