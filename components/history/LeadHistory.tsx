
import { getLeadHistory } from "@/lib/history";

interface Props {
  leadId: number;
}

export default async function LeadHistory({
  leadId,
}: Props) {
  const history = await getLeadHistory(leadId);

  return (
    <div className="rounded-xl border bg-white p-6 shadow">

      <h2 className="mb-6 text-xl font-bold">
        Lead History
      </h2>

      {history.length === 0 ? (
        <p className="text-slate-500">
          No history available.
        </p>
      ) : (
        <div className="space-y-5">

          {history.map((item: any) => (
            <div
              key={item.id}
              className="border-l-4 border-blue-600 pl-4"
            >
              <div className="text-sm text-slate-500">
                {new Date(item.created_at).toLocaleString()}
              </div>

              <div className="mt-1 font-semibold">
                {item.action}
              </div>

              <div className="text-sm">
                {item.action_by_name}
              </div>

              {item.old_value && (
                <div className="text-sm text-red-600">
                  Old: {item.old_value}
                </div>
              )}

              {item.new_value && (
                <div className="text-sm text-green-600">
                  New: {item.new_value}
                </div>
              )}

              {item.notes && (
                <div className="mt-2 text-sm text-slate-600">
                  {item.notes}
                </div>
              )}
            </div>
          ))}

        </div>
      )}

    </div>
  );
}