import MainLayout from "@/components/layout/MainLayout";
import MyLeadsTable from "@/components/agent/MyLeadsTable";
import { getMyLeads } from "@/lib/myLeads";

export default async function MyLeadsPage() {
  const leads = await getMyLeads();

  return (
    <MainLayout>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold">
            My Leads
          </h1>

          <p className="text-slate-500">
            Leads assigned to you
          </p>
        </div>

        <MyLeadsTable leads={leads} />

      </div>
    </MainLayout>
  );
}