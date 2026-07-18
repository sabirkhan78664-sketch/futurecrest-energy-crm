interface Followup {
  id: number;
  followup_date: string;
  followup_time: string | null;
  callback_type: string | null;
  notes: string | null;
  status: string;
}

interface Props {
  followups: Followup[];
}

export default function FollowupTimeline({
  followups,
}: Props) {
  if (followups.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-bold">
          Follow-up Timeline
        </h2>

        <p className="text-slate-500">
          No follow-ups available.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow">

      <h2 className="mb-6 text-xl font-bold">
        Follow-up Timeline
      </h2>

      <div className="space-y-5">

        {followups.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border p-5"
          >
            <div className="flex items-center justify-between">

              <div>

                <p className="font-bold">
                  {new Date(item.followup_date).toLocaleDateString("en-AU")}
                </p>

                <p className="text-sm text-slate-500">
                  {item.followup_time || "-"}
                </p>

              </div>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                {item.status}
              </span>

            </div>

            <div className="mt-4">

              <p className="font-semibold">
                {item.callback_type}
              </p>

              <p className="mt-2 text-slate-600">
                {item.notes || "-"}
              </p>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}