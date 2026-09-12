import MainLayout from "@/components/layout/MainLayout";
import LeadsClient from "@/components/leads/LeadsClient";
import { getLeads } from "@/lib/leads";
import { getCurrentUserProfile } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { getZonedTodayStart } from "@/lib/timezone";

interface LeadsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    campaign?: string;
    period?: string;
  }>;
}

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
  // 2. INITIAL FILTERS (from URL — deep-links from Dashboard/Reports/
  // QA etc. still land pre-filtered). Everything past this point is
  // owned by LeadsClient: search, status, campaign, period, fuel,
  // agent, and channel are all client-side state from here on, so the
  // table and the metric cards can never compute from two different
  // datasets.
  // ============================================================

  const params = await searchParams;

  const initialFilters = {
    search:
      typeof params?.search === "string"
        ? params.search.trim()
        : "",
    status:
      typeof params?.status === "string"
        ? params.status.trim()
        : "",
    campaign:
      typeof params?.campaign === "string"
        ? params.campaign.trim()
        : "",
    period:
      typeof params?.period === "string" && params.period.trim()
        ? params.period.trim().toLowerCase()
        : "today",
  };

  // ============================================================
  // 3. GET ALL LEADS
  // ============================================================

  const rawLeads = await getLeads();

  // ============================================================
  // 4. LOAD PROFILES
  //
  // Only needed for the role-permission match below (Agent/Channel
  // Partner leads may be matched by employee_id/full_name rather than
  // just the assigned_agent id) — this is a security check and stays
  // server-side.
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
  //
  // The single, canonical role-permission pass. Both the table and
  // the metric cards are computed client-side in LeadsClient from
  // this exact same list, so they can never diverge.
  // ============================================================

  const permittedLeads = rawLeads.filter((lead: any) => {
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

      const isMine =
        assignedCloserId === userId ||
        assignedCloserId === empId;

      const isUnclaimed =
        !lead.assigned_closer &&
        lead.approval_status === "Approved";

      return isMine || isUnclaimed;
    }

    return false;
  });

  // "Today" must be evaluated in the business's own timezone, not the
  // browser's — computed once here (server-side) and handed to the
  // client so LeadsClient never needs its own timezone-aware logic.
  const todayStartIST = getZonedTodayStart(
    "Asia/Kolkata"
  ).toISOString();

  // ============================================================
  // 6. PAGE
  // ============================================================

  return (
    <MainLayout>
      <LeadsClient
        leads={permittedLeads}
        role={profile.role}
        initialFilters={initialFilters}
        todayStartIST={todayStartIST}
        mode="leads"
      />
    </MainLayout>
  );
}
