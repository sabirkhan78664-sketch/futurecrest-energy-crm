"use client";

interface DuplicateLeadModalProps {
  open: boolean;
  lead: any;
  // Whether the API's rules would actually accept an override from this
  // user for this specific duplicate — server-side stays the source of
  // truth regardless of what this shows.
  canOverride: boolean;
  reason: string;
  setReason: (value: string) => void;
  onClose: () => void;
  onOverride: () => void;
}

export default function DuplicateLeadModal({
  open,
  lead,
  canOverride,
  reason,
  setReason,
  onClose,
  onOverride,
}: DuplicateLeadModalProps) {
  if (!open) return null;

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

        {!canOverride && (
          <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            This lead cannot be resubmitted right now.
          </p>
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