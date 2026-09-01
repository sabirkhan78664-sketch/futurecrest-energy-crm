import MainLayout from "@/components/layout/MainLayout";
import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Link from "next/link";
import { AlertCircle, CalendarClock, Phone, ArrowRight } from "lucide-react";

export default async function FollowupsPage() {
  // Follow-ups is in the nav for Agent, Admin, and Super Admin only.
  const { profile } = await requireRole(["Agent", "Admin", "Super Admin"]);

  const supabase = await createSupabaseServerClient();

  // Fetch leads with a "Follow-up" status. Agents may only see their own
  // follow-up leads — everyone else with access to this page sees all of them.
  let query = supabase
    .from("leads")
    .select("*")
    .eq("status", "Follow-up");

  if (profile.role === "Agent") {
    query = query.eq("assigned_agent", profile.id);
  }

  const { data: leads } = await query
    .order("callback_date", { ascending: true })
    .order("callback_time", { ascending: true });

  const allLeads = leads || [];

  // Get today's date in YYYY-MM-DD format to compare against database dates
  const today = new Date().toISOString().split("T")[0];

  // Filter leads based on their callback dates
  const missedFollowups = allLeads.filter(
    (lead) => lead.callback_date && lead.callback_date < today
  );
  
  const todayFollowups = allLeads.filter(
    (lead) => lead.callback_date === today
  );

  return (
    <MainLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Follow-ups Dashboard</h1>
          <p className="mt-1 text-slate-500">Manage your scheduled follow-ups and missed calls</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* MISSED FOLLOW-UPS SECTION */}
        <div className="rounded-xl border border-red-100 bg-white shadow-sm">
          <div className="border-b border-red-100 bg-red-50/50 p-5 rounded-t-xl flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <h2 className="text-xl font-semibold text-red-800">
              Missed Follow-ups <span className="ml-2 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700">{missedFollowups.length}</span>
            </h2>
          </div>
          
          <div className="p-0">
            {missedFollowups.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No missed follow-ups! Great job.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900">
                    <tr>
                      <th className="p-4 font-semibold">Customer</th>
                      <th className="p-4 font-semibold">Mobile</th>
                      <th className="p-4 font-semibold">Agent</th>
                      <th className="p-4 font-semibold">Scheduled Date</th>
                      <th className="p-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {missedFollowups.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900">{lead.customer_name}</td>
                        <td className="p-4">
                          <a href={`tel:${lead.mobile}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Phone size={14} /> {lead.mobile}
                          </a>
                        </td>
                        <td className="p-4">{lead.assigned_agent || "Unassigned"}</td>
                        <td className="p-4 text-red-600 font-medium">
                          {lead.callback_date} at {lead.callback_time?.substring(0, 5)}
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 transition"
                          >
                            View Lead <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* TODAY'S FOLLOW-UPS SECTION */}
        <div className="rounded-xl border border-blue-100 bg-white shadow-sm">
          <div className="border-b border-blue-100 bg-blue-50/50 p-5 rounded-t-xl flex items-center gap-2">
            <CalendarClock className="text-blue-600" size={20} />
            <h2 className="text-xl font-semibold text-blue-800">
              Today's Follow-ups <span className="ml-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">{todayFollowups.length}</span>
            </h2>
          </div>
          
          <div className="p-0">
            {todayFollowups.length === 0 ? (
              <p className="p-6 text-center text-gray-500">No follow-ups scheduled for today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900">
                    <tr>
                      <th className="p-4 font-semibold">Time</th>
                      <th className="p-4 font-semibold">Customer</th>
                      <th className="p-4 font-semibold">Mobile</th>
                      <th className="p-4 font-semibold">Agent</th>
                      <th className="p-4 font-semibold">Campaign</th>
                      <th className="p-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {todayFollowups.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-900">
                           {lead.callback_time?.substring(0, 5) || "Anytime"}
                        </td>
                        <td className="p-4 font-medium text-gray-900">{lead.customer_name}</td>
                        <td className="p-4">
                          <a href={`tel:${lead.mobile}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Phone size={14} /> {lead.mobile}
                          </a>
                        </td>
                        <td className="p-4">{lead.assigned_agent || "Unassigned"}</td>
                        <td className="p-4">{lead.campaign || "-"}</td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
                          >
                            View Lead <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </MainLayout>
  );
}