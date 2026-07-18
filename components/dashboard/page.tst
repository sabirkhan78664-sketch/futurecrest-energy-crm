import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { BarChart3, CheckCircle, Clock, Users } from "lucide-react";

export default async function DashboardPage() {
  // Fetch data from Supabase
  const { data: leads } = await supabase.from("leads").select("status");
  const { data: users } = await supabase.from("users").select("id").eq("status", "Active");

  const allLeads = leads || [];
  
  // Calculate Stats
  const totalLeads = allLeads.length;
  const totalSales = allLeads.filter((l) => l.status === "Sale").length;
  const pendingCallbacks = allLeads.filter((l) => l.status === "Callback").length;
  const activeAgents = users?.length || 0;

  const stats = [
    { name: "Total Leads", value: totalLeads, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-100" },
    { name: "Total Sales", value: totalSales, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
    { name: "Callbacks Pending", value: pendingCallbacks, icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
    { name: "Active Agents", value: activeAgents, icon: Users, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <MainLayout>
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-bold">Recent Activity</h2>
        <p className="text-gray-500">Welcome back, Azhar bhai! Your team is performing great today.</p>
      </div>
    </MainLayout>
  );
}