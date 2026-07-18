interface Props {
  leads: any[];
}

export default function MyLeadsTable({
  leads,
}: Props) {
  return (
    <div className="rounded-xl border bg-white shadow overflow-x-auto">

      <table className="min-w-full">

        <thead className="bg-slate-100">
          <tr>
            <th className="px-4 py-3 text-left">Lead ID</th>
            <th className="px-4 py-3 text-left">Customer</th>
            <th className="px-4 py-3 text-left">Mobile</th>
            <th className="px-4 py-3 text-left">Fuel</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>

        <tbody>

          {leads.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="py-10 text-center text-slate-500"
              >
                No leads assigned.
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
              <tr key={lead.id} className="border-t">

                <td className="px-4 py-3">
                  {lead.lead_id}
                </td>

                <td className="px-4 py-3">
                  {lead.customer_name}
                </td>

                <td className="px-4 py-3">
                  {lead.mobile}
                </td>

                <td className="px-4 py-3">
                  {lead.fuel_type}
                </td>

                <td className="px-4 py-3">
                  {lead.status}
                </td>

              </tr>
            ))
          )}

        </tbody>

      </table>

    </div>
  );
}