import { requireRole } from "@/lib/auth";
import MainLayout from "@/components/layout/MainLayout";
import LeadsClient from "@/components/leads/LeadsClient";
import { getPendingApprovals } from "@/lib/leads";

function getPeriodStart(period: string): Date | null {
  const now = new Date();

  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
  }

  if (period === "month") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return start;
  }

  return null;
}

const PERIOD_LABELS: Record<string, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};

interface Props {
  searchParams: Promise<{ period?: string }>;
}

export default async function PendingApprovalsPage({ searchParams }: Props) {
  await requireRole([
    "Admin",
    "Super Admin",
  ]);

  const { period = "" } = await searchParams;
  const periodStart = getPeriodStart(period);

  const allLeads = await getPendingApprovals();

  const leads = periodStart
    ? allLeads.filter(
        (lead: any) => lead.created_at && new Date(lead.created_at) >= periodStart
      )
    : allLeads;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Pending Approvals
          </h1>

          <p className="text-slate-500">
            Review leads submitted by agents.
          </p>

          {PERIOD_LABELS[period] && (
            <div className="mt-2 text-sm text-slate-500">
              Showing:
              <span className="ml-2 rounded-md bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                {PERIOD_LABELS[period]}
              </span>
            </div>
          )}
        </div>

        <LeadsClient
          leads={leads}
          mode="pending"
        />
      </div>
    </MainLayout>
  );
}