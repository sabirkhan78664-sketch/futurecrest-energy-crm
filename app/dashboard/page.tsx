import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

import MainLayout from "@/components/layout/MainLayout";
import LeadsRealtimeRefresher from "@/components/leads/LeadsRealtimeRefresher";

import SuperAdminDashboard from "@/components/closers/dashboard/SuperAdminDashboard";
import QADashboard from "@/components/closers/dashboard/QADashboard";
import DashboardPeriodTabs from "@/components/dashboard/DashboardPeriodTabs";
import { validateCustomRange } from "@/lib/timezone";

interface DashboardPageProps {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { period = "today", from = "", to = "" } = await searchParams;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role = profile?.role;

  /*
   * CLOSER
   *
   * The new Closer dashboard lives at /closer.
   * Redirect Closer users there so /dashboard
   * does not show the old Closer dashboard.
   */
  if (role === "Closer") {
    redirect("/closer");
  }

  /*
   * AGENT
   *
   * The real Agent dashboard lives at /agent (Quick Actions layout).
   * The AgentDashboard component below is an old stub with hardcoded
   * "--" placeholders that was never wired to real data — redirect
   * instead of rendering it, same pattern as the Closer redirect above.
   */
  if (role === "Agent" || role === "Channel Partner") {
    redirect("/agent");
  }

  // An invalid Custom range must never behave like "All time": show the
  // validation message (inside the period bar) and run no dashboard query.
  const invalidCustom =
    period === "custom" && validateCustomRange({ from, to });

  if (invalidCustom) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <DashboardPeriodTabs period={period} from={from} to={to} />
          <p className="text-sm text-slate-500">
            Select a valid start and end date to view the dashboard.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <LeadsRealtimeRefresher />

      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            Welcome back, {profile?.full_name || "User"}{" "}
            {role ? `(${role})` : ""}
          </h1>
        </div>

        {/* SUPER ADMIN / ADMIN */}
        {(role === "Super Admin" || role === "Admin") && (
          <SuperAdminDashboard period={period} from={from} to={to} />
        )}

        {/* QA */}
        {role === "QA" && <QADashboard period={period} from={from} to={to} />}

      </div>
    </MainLayout>
  );
}