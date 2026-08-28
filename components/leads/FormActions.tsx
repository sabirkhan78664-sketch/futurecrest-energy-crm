interface FormActionsProps {
  loading: boolean;
  isEdit: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export default function FormActions({
  loading,
  isEdit,
  onCancel,
  onSave,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-4 border-t border-slate-200 pt-8">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-slate-300 px-8 py-3 font-semibold hover:bg-slate-100"
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={loading}
        className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading
          ? "Saving..."
          : isEdit
          ? "Update Lead"
          : "Save Lead"}
      </button>
    </div>
  );
}