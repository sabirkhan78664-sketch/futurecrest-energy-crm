"use client";

interface Props {
  open: boolean;
  loading: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteUserDialog({
  open,
  loading,
  userName,
  onClose,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-red-600">
          Delete User
        </h2>

        <p className="mt-4 text-slate-700">
          Are you sure you want to delete:
        </p>

        <p className="mt-2 text-lg font-semibold">
          {userName}
        </p>

        <p className="mt-4 text-sm text-red-500">
          This action cannot be undone.
        </p>

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border px-5 py-2"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}