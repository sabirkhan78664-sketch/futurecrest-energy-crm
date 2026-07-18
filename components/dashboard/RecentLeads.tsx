import Link from "next/link";
import { getLeads } from "@/lib/leads";

export default async function RecentLeads() {
  const leads = await getLeads();

  const recent = leads.slice(0, 5);

  return (
    <div className="rounded-xl border bg-white p-6 shadow">

      <div className="mb-5 flex items-center justify-between">

        <h2 className="text-xl font-bold">
          Recent Leads
        </h2>

        <Link
          href="/leads"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          View All
        </Link>

      </div>

      <div className="space-y-3">

        {recent.length === 0 ? (
          <p className="text-slate-500">
            No leads found.
          </p>
        ) : (
          recent.map((lead: any) => (
            <div
              key={lead.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50"
            >
              <div>
                <p className="font-semibold">
                  {lead.customer_name}
                </p>

                <p className="text-sm text-slate-500">
                  {lead.lead_id}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  lead.status === "Sale"
                    ? "bg-green-100 text-green-700"
                    : lead.status === "Interested"
                    ? "bg-blue-100 text-blue-700"
                    : lead.status === "Callback"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {lead.status ?? "New"}
              </span>
            </div>
          ))
        )}

      </div>

    </div>
  );
}