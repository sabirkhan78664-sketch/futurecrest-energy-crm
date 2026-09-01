import MainLayout from "@/components/layout/MainLayout";
import LeadsClient from "@/components/leads/LeadsClient";
import { getLeads } from "@/lib/leads";
import { getCurrentUserProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { redirect } from "next/navigation";

interface LeadsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    campaign?: string;
    period?: string;
  }>;
}

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

export default async function LeadsPage({
  searchParams,
}: LeadsPageProps) {
  // ============================================================
  // 1. CURRENT USER
  // ============================================================

  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  // Channel Partners get a dedicated, simpler leads list at /my-leads
  // and must never land on the shared admin-style Leads page.
  if (profile.role === "Channel Partner") {
    redirect("/my-leads");
  }

  // ============================================================
  // 2. SEARCH PARAMETERS
  // ============================================================

  const params = await searchParams;

  let searchQuery =
    typeof params?.search === "string"
      ? params.search.trim().toLowerCase()
      : "";

  const statusFilter =
    typeof params?.status === "string"
      ? params.status.trim()
      : "";

  const campaignFilter =
    typeof params?.campaign === "string"
      ? params.campaign.trim()
      : "";

  const periodFilter =
    typeof params?.period === "string"
      ? params.period.trim().toLowerCase()
      : "";

  // Normalize global search
  searchQuery = searchQuery
    .replace(/^lead\s*id\s*:\s*/i, "")
    .replace(/^lead\s*:\s*/i, "")
    .trim();

  // ============================================================
  // 3. GET ALL LEADS
  // ============================================================

  const rawLeads = await getLeads();

  // ============================================================
  // 4. LOAD PROFILES
  // ============================================================

  const { data: searchableProfiles } = await supabase
    .from("profiles")
    .select("id, employee_id, full_name, role");

  const profileMap = new Map<
    string,
    {
      employee_id: string;
      full_name: string;
      role: string;
    }
  >();

  (searchableProfiles || []).forEach((user: any) => {
    profileMap.set(String(user.id), {
      employee_id: String(user.employee_id || ""),
      full_name: String(user.full_name || ""),
      role: String(user.role || ""),
    });
  });

  // ============================================================
  // 5. ROLE-BASED SECURITY
  // ============================================================

  let permittedLeads = rawLeads.filter((lead: any) => {
    // ----------------------------------------------------------
    // ADMIN / SUPER ADMIN / QA
    // ----------------------------------------------------------

    if (
      profile.role === "Super Admin" ||
      profile.role === "Admin" ||
      profile.role === "QA"
    ) {
      return true;
    }

    // ----------------------------------------------------------
    // AGENT / CHANNEL PARTNER
    // ----------------------------------------------------------

    if (
      profile.role === "Agent" ||
      profile.role === "Channel Partner"
    ) {
      const empId = String(profile.employee_id || "");
      const userId = String(profile.id || "");

      const assignedProfile =
        lead.assigned_agent
          ? profileMap.get(
              String(lead.assigned_agent)
            )
          : undefined;

      const assignedEmployeeId = String(
        assignedProfile?.employee_id || ""
      );

      const assignedAgentName = String(
        assignedProfile?.full_name || ""
      );

      const f1 = String(lead.agent_id || "");
      const f2 = String(lead.assigned_to || "");
      const f3 = String(lead.assigned_agent || "");
      const f4 = String(lead.agent || "");

      return (
        f1 === empId ||
        f1 === userId ||
        f2 === empId ||
        f2 === userId ||
        f3 === empId ||
        f3 === userId ||
        assignedEmployeeId === empId ||
        assignedProfile?.full_name ===
          profile.full_name ||
        f4 === empId ||
        f4 === userId ||
        assignedAgentName === profile.full_name
      );
    }

    // ----------------------------------------------------------
    // CLOSER
    // ----------------------------------------------------------

    if (profile.role === "Closer") {
      const empId = String(profile.employee_id || "");
      const userId = String(profile.id || "");

      const assignedCloserId = String(
        lead.assigned_closer || ""
      );

      return (
        assignedCloserId === userId ||
        assignedCloserId === empId
      );
    }

    return false;
  });

  // ============================================================
  // 6. GLOBAL SEARCH
  // ============================================================

  if (searchQuery) {
    permittedLeads = permittedLeads.filter(
      (lead: any) => {
        const assignedAgentProfile =
          lead.assigned_agent
            ? profileMap.get(
                String(lead.assigned_agent)
              )
            : undefined;

        const searchableValues = [
          lead.id,
          lead.lead_id,
          lead.lead_reference,
          lead.customer_name,
          lead.mobile,
          lead.email,
          lead.nmi,
          lead.mirn,
          assignedAgentProfile?.employee_id,
          assignedAgentProfile?.full_name,
        ];

        return searchableValues.some((value) => {
          if (
            value === null ||
            value === undefined
          ) {
            return false;
          }

          return String(value)
            .toLowerCase()
            .includes(searchQuery);
        });
      }
    );
  }

  // ============================================================
  // 7. QUICK CARD STATUS FILTER
  // ============================================================

  if (statusFilter) {
    permittedLeads = permittedLeads.filter(
      (lead: any) => {
        const leadStatus = String(
          lead.status || ""
        ).toLowerCase();

        const wantedStatus =
          statusFilter.toLowerCase();

        // IMPORTANT:
        // Current Closer workflow uses "Sold"
        // NOT "Sale".
        return leadStatus === wantedStatus;
      }
    );
  }

  // ============================================================
  // 7b. CAMPAIGN FILTER
  // ============================================================

  if (campaignFilter) {
    permittedLeads = permittedLeads.filter(
      (lead: { campaign?: string | null }) => {
        const leadCampaign = String(
          lead.campaign || ""
        ).toLowerCase();

        return (
          leadCampaign ===
          campaignFilter.toLowerCase()
        );
      }
    );
  }

  // ============================================================
  // 8. PERIOD FILTER (today / week / month)
  //
  // Sold leads are bucketed by closed_at (when the Closer actually
  // recorded the outcome) — matches how the Dashboard's Sales metric
  // is computed. Everything else buckets by created_at.
  // ============================================================

  const periodStart = getPeriodStart(periodFilter);

  if (periodStart) {
    const isSoldFilter =
      statusFilter.toLowerCase() === "sold";

    permittedLeads = permittedLeads.filter(
      (lead: any) => {
        const dateValue = isSoldFilter
          ? lead.closed_at
          : lead.created_at;

        if (!dateValue) {
          return false;
        }

        return new Date(dateValue) >= periodStart;
      }
    );
  }

  // ============================================================
  // 9. FINAL LEADS
  // ============================================================

  const leads = permittedLeads;

  // ============================================================
  // 10. STATISTICS
  //
  // IMPORTANT:
  // Sales = Sold
  // ============================================================

  const allPermittedLeads = rawLeads.filter(
    (lead: any) => {
      if (
        profile.role === "Super Admin" ||
        profile.role === "Admin" ||
        profile.role === "QA"
      ) {
        return true;
      }

      if (
        profile.role === "Agent" ||
        profile.role === "Channel Partner"
      ) {
        const empId = String(
          profile.employee_id || ""
        );

        const userId = String(
          profile.id || ""
        );

        const assignedProfile =
          lead.assigned_agent
            ? profileMap.get(
                String(lead.assigned_agent)
              )
            : undefined;

        const assignedEmployeeId =
          String(
            assignedProfile?.employee_id || ""
          );

        const assignedAgentName =
          String(
            assignedProfile?.full_name || ""
          );

        return (
          String(lead.agent_id || "") ===
            empId ||
          String(lead.agent_id || "") ===
            userId ||
          String(lead.assigned_to || "") ===
            empId ||
          String(lead.assigned_to || "") ===
            userId ||
          String(lead.assigned_agent || "") ===
            empId ||
          String(lead.assigned_agent || "") ===
            userId ||
          assignedEmployeeId === empId ||
          assignedAgentName ===
            profile.full_name ||
          String(lead.agent || "") ===
            empId ||
          String(lead.agent || "") ===
            userId
        );
      }

      if (profile.role === "Closer") {
        const empId = String(
          profile.employee_id || ""
        );

        const userId = String(
          profile.id || ""
        );

        const assignedCloserId =
          String(
            lead.assigned_closer || ""
          );

        return (
          assignedCloserId === userId ||
          assignedCloserId === empId
        );
      }

      return false;
    }
  );

  const totalLeads =
    allPermittedLeads.length;

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todayLeads =
    allPermittedLeads.filter(
      (lead: any) =>
        lead.created_at &&
        String(lead.created_at).startsWith(today)
    ).length;

  // ============================================================
  // IMPORTANT FIX:
  // CLOSER SAVES "Sold"
  // ============================================================

  const sales =
    allPermittedLeads.filter(
      (lead: any) =>
        String(lead.status || "")
          .toLowerCase() === "sold"
    ).length;

  const followups =
    allPermittedLeads.filter(
      (lead: any) =>
        String(lead.status || "")
          .toLowerCase() === "follow-up"
    ).length;

  const rejected =
    allPermittedLeads.filter(
      (lead: any) =>
        String(lead.status || "")
          .toLowerCase() === "rejected" ||
        String(lead.status || "")
          .toLowerCase() === "lost"
    ).length;

  console.log(
    "========================================"
  );

  console.log(
    "AGENT / LEADS DASHBOARD"
  );

  console.log(
    "User:",
    profile.full_name
  );

  console.log(
    "Role:",
    profile.role
  );

  console.log(
    "Total:",
    totalLeads
  );

  console.log(
    "Today's:",
    todayLeads
  );

  console.log(
    "Sold:",
    sales
  );

  console.log(
    "Follow-ups:",
    followups
  );

  console.log(
    "Rejected:",
    rejected
  );

  console.log(
    "========================================"
  );

  // ============================================================
  // 11. PAGE
  // ============================================================

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {profile.role === "Agent" ||
              profile.role === "Closer" ||
              profile.role === "Channel Partner"
                ? "My Leads"
                : "Lead Management"}
            </h1>

            <p className="text-slate-500">
              Manage FutureCrest Energy Leads
            </p>

            {searchQuery && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-slate-500">
                  Search results for:
                </span>

                <span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                  "{searchQuery}"
                </span>

                <Link
                  href="/leads"
                  className="font-medium text-red-600 hover:text-red-700"
                >
                  Clear
                </Link>
              </div>
            )}

            {statusFilter && (
              <div className="mt-2 text-sm text-slate-500">
                Filter:
                <span className="ml-2 rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                  {statusFilter}
                </span>
              </div>
            )}

            {campaignFilter && (
              <div className="mt-2 text-sm text-slate-500">
                Campaign:
                <span className="ml-2 rounded-md bg-purple-50 px-2 py-1 font-semibold text-purple-700">
                  {campaignFilter}
                </span>
              </div>
            )}

            {PERIOD_LABELS[periodFilter] && (
              <div className="mt-2 text-sm text-slate-500">
                Showing:
                <span className="ml-2 rounded-md bg-indigo-50 px-2 py-1 font-semibold text-indigo-700">
                  {PERIOD_LABELS[periodFilter]}
                </span>
              </div>
            )}
          </div>

          <Link
            href="/leads/new"
            className="rounded-lg bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700"
          >
            + New Lead
          </Link>
        </div>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 xl:grid-cols-6">

          <StatCard
            title="Total Leads"
            value={totalLeads}
            color="text-blue-600"
            href="/leads"
          />

          <StatCard
            title="Today's Leads"
            value={todayLeads}
            color="text-indigo-600"
            href="/leads?period=today"
          />

          <StatCard
            title="Sales"
            value={sales}
            color="text-green-600"
            href="/leads?status=Sold"
          />

          <StatCard
            title="Follow-ups"
            value={followups}
            color="text-yellow-600"
            href="/leads?status=Follow-up"
          />

          <StatCard
            title="Rejected"
            value={rejected}
            color="text-red-600"
            href="/leads?status=Rejected"
          />

        </div>

        {/* =====================================================
            NO SEARCH RESULTS
        ===================================================== */}

        {searchQuery &&
        leads.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
              🔎
            </div>

            <h2 className="text-xl font-semibold text-slate-900">
              No leads found
            </h2>

            <p className="mt-2 text-slate-500">
              No permitted leads match "
              {searchQuery}".
            </p>

            <Link
              href="/leads"
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Clear Search
            </Link>

          </div>
        ) : (
          <LeadsClient
            leads={leads}
            mode="leads"
          />
        )}

      </div>
    </MainLayout>
  );
}

// ============================================================
// STAT CARD
// ============================================================

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  href: string;
}

function StatCard({
  title,
  value,
  color,
  href,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
    >
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <h2
        className={`mt-3 text-3xl font-bold ${color}`}
      >
        {value}
      </h2>

      <p className="mt-2 text-xs font-medium text-slate-400 transition group-hover:text-blue-600">
        View leads →
      </p>
    </Link>
  );
}