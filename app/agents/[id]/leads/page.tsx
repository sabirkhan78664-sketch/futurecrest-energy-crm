import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgent } from "@/lib/agents";
import { getAgentLeads } from "@/lib/leads";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function AgentLeadsPage({
  params,
}: Props) {
  const { id } = await params;

  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  const leads = await getAgentLeads(id);

  return (
    <MainLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold">
              {agent.full_name}
            </h1>

            <p className="text-slate-500">
              Assigned Leads
            </p>

          </div>

          <Link
            href={`/agents/${id}`}
            className="rounded-lg border px-5 py-3"
          >
            ← Back
          </Link>

        </div>

        <div className="rounded-xl bg-white shadow">

          <table className="min-w-full">

            <thead className="bg-slate-100">

              <tr>

                <th className="px-5 py-4 text-left">
                  Lead ID
                </th>

                <th className="px-5 py-4 text-left">
                  Customer
                </th>

                <th className="px-5 py-4 text-left">
                  Mobile
                </th>

                <th className="px-5 py-4 text-left">
                  Campaign
                </th>

                <th className="px-5 py-4 text-center">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {leads.length === 0 ? (

                <tr>

                  <td
                    colSpan={5}
                    className="py-12 text-center text-slate-500"
                  >
                    No Assigned Leads
                  </td>

                </tr>

              ) : (

                leads.map((lead: any) => (

                  <tr
                    key={lead.id}
                    className="border-t hover:bg-slate-50"
                  >

                    <td className="px-5 py-4">
                      {lead.lead_id}
                    </td>

                    <td className="px-5 py-4">
                      {lead.customer_name}
                    </td>

                    <td className="px-5 py-4">
                      {lead.mobile}
                    </td>

                    <td className="px-5 py-4">
                      {lead.campaign}
                    </td>

                    <td className="px-5 py-4 text-center">

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                        {lead.status}
                      </span>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>
    </MainLayout>
  );
}