import Link from "next/link";

interface Props { leads: any[]; }

function displayStatus(lead: any) {
  const status = String(lead.status || "").trim();
  const approval = String(lead.approval_status || "").toLowerCase();
  const qa = String(lead.qa_status || "").toLowerCase();
  if (status.toLowerCase() === "rejected" || status.toLowerCase() === "lost" || approval === "rejected" || qa === "rejected") return "Rejected";
  return status || "Pending";
}

function statusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "sold") return "bg-emerald-100 text-emerald-700";
  if (normalized === "follow-up") return "bg-blue-100 text-blue-700";
  if (normalized === "interested") return "bg-teal-100 text-teal-700";
  if (normalized === "processing") return "bg-cyan-100 text-cyan-700";
  if (normalized === "no answer") return "bg-slate-100 text-slate-700";
  if (normalized === "internal dnc") return "bg-red-900 text-red-50";
  if (normalized === "ngtg") return "bg-slate-300 text-slate-800";
  if (normalized === "rejected" || normalized === "lost") return "bg-red-100 text-red-700";
  if (normalized === "assigned") return "bg-purple-100 text-purple-700";
  return "bg-amber-100 text-amber-700";
}

function campaignBadgeClass(campaign: string) {
  if (campaign === "energy") return "bg-blue-100 text-blue-700";
  if (campaign === "phi") return "bg-purple-100 text-purple-700";
  if (campaign === "nbn") return "bg-green-100 text-green-700";
  return "bg-slate-100 text-slate-600";
}

function campaignLabel(lead: any) {
  const campaign = String(lead.campaign || lead.form_type || "").trim();
  return campaign || "-";
}

function formatDDMMYYYY(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function MyLeadsTable({ leads }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm text-slate-600">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Lead ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Offered Retailer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  No leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const status = displayStatus(lead);
                const campaign = campaignLabel(lead);

                return (
                  <tr key={lead.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link
                        href={`/my-leads/${encodeURIComponent(lead.lead_id || String(lead.id))}`}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        {lead.lead_id || `#${lead.id}`}
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-[200px] truncate font-medium text-slate-900">
                        {lead.customer_name || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500">{lead.mobile || "-"}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${campaignBadgeClass(
                          campaign.toLowerCase()
                        )}`}
                      >
                        {campaign}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs">{lead.offered_retailer || "—"}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-400">
                      {formatDDMMYYYY(lead.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
