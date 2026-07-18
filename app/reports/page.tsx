import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { BarChart3, Download, TrendingUp } from "lucide-react";

export default async function ReportsPage() {
  const { data: leads } = await supabase.from("leads").select("status, campaign");
  const allLeads = leads || [];

  // Simple calculation for conversion rate
  const totalLeads = allLeads.length;
  const totalSales = allLeads.filter((l) => l.status === "Sale").length;
  const conversionRate = totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : 0;

  return (
    <MainLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-slate-500">Track your campaign performance and team metrics</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-slate-800 px-5 py-3 text-white hover:bg-black transition">
          <Download size={18} />
          Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <TrendingUp size={20} />
            <span className="font-semibold">Conversion Rate</span>
          </div>
          <h3 className="text-4xl font-bold">{conversionRate}%</h3>
        </div>
        
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <BarChart3 size={20} />
            <span className="font-semibold">Total Sales</span>
          </div>
          <h3 className="text-4xl font-bold">{totalSales}</h3>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Performance by Campaign</h2>
        <div className="text-center py-10 text-gray-500 italic">
          Coming Soon: Detailed campaign performance charts.
        </div>
      </div>
    </MainLayout>
  );
}