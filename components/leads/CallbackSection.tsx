interface CallbackSectionProps {
  status: string;

  callbackDate: string;
  setCallbackDate: (value: string) => void;

  callbackTime: string;
  setCallbackTime: (value: string) => void;
}

export default function CallbackSection({
  status,
  callbackDate,
  setCallbackDate,
  callbackTime,
  setCallbackTime,
}: CallbackSectionProps) {
  if (status !== "Callback") return null;

  return (
    <section>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">

        <div>

          <label className="mb-2 block text-sm font-medium">
            Callback Date
          </label>

          <input
            type="date"
            value={callbackDate}
            onChange={(e) => setCallbackDate(e.target.value)}
            className="h-11 w-full rounded-xl border border-blue-300 bg-blue-50 px-4"
          />

        </div>

        <div>

          <label className="mb-2 block text-sm font-medium">
            Callback Time
          </label>

          <input
            type="time"
            value={callbackTime}
            onChange={(e) => setCallbackTime(e.target.value)}
            className="h-11 w-full rounded-xl border border-blue-300 bg-blue-50 px-4"
          />

        </div>

      </div>

    </section>
  );
}