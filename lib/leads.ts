import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "./supabase-server";


/* ===========================
   ENRICH LEAD PEOPLE
=========================== */

async function enrichLeadPeople(rows: any[]) {
  const creatorIds = Array.from(
    new Set(
      rows
        .map((row) => row?.created_by)
        .filter((id): id is string => Boolean(id))
    )
  );

  const assignedAgentIds = Array.from(
    new Set(
      rows
        .map((row) => row?.assigned_agent)
        .filter((id): id is string => Boolean(id))
    )
  );

  const closerIds = Array.from(
    new Set(
      rows
        .map((row) => row?.assigned_closer)
        .filter((id): id is string => Boolean(id))
    )
  );

  const allIds = Array.from(new Set([...creatorIds, ...assignedAgentIds, ...closerIds]));

  if (!allIds.length) return rows;

  const { data: people, error } = await adminSupabase
    .from("profiles")
    .select("id, employee_id, full_name, username")
    .in("id", allIds);

  if (error) {
    console.error("enrichLeadPeople:", error);
    return rows;
  }

  const peopleMap = new Map(
    (people ?? []).map((profile: any) => [profile.id, profile])
  );

  return rows.map((row) => ({
    ...row,
    creator: row.created_by
      ? peopleMap.get(row.created_by) ?? null
      : null,
    assignedAgent: row.assigned_agent
      ? peopleMap.get(row.assigned_agent) ?? row.agent ?? null
      : row.agent ?? null,
    closer: row.assigned_closer
      ? peopleMap.get(row.assigned_closer) ?? null
      : null,
  }));
}

/* ===========================
   GET LEADS (ROLE BASED)
=========================== */

export async function getLeads() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

  if (profileError || !profile) {
    console.error("getLeads profile error:", profileError);
    return [];
  }

  /*
   * AGENT / CHANNEL PARTNER
   *
   * Agent (and Channel Partner, who submits leads the same way) can
   * see their own leads immediately after submitting them.
   */
  if (
    profile.role === "Agent" ||
    profile.role === "Channel Partner"
  ) {
    // Keep the Agent's All Leads dataset identical to My Leads.
    // A lead belongs to the agent when it was assigned to them OR
    // when they created/submitted it and it has not yet been assigned.
    // Use the service-role client here so RLS cannot make All Leads
    // disagree with the My Leads page.
    const { data, error } = await adminSupabase
      .from("leads")
      .select(
        `*,
         agent:profiles!leads_assigned_agent_fkey(
           id,
           employee_id,
           full_name,
           username
         )`
      )
      .or(`assigned_agent.eq.${user.id},created_by.eq.${user.id}`)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("getLeads Agent error:", error);
      return [];
    }

    return enrichLeadPeople(data ?? []);
  }

  /*
   * QA
   *
   * QA can see every lead, including leads that are still awaiting
   * approval. This is visibility only; the audit action itself is
   * restricted to Sold leads by the Post-Sale QA API.
   */
  if (profile.role === "QA") {
    const { data, error } = await adminSupabase
      .from("leads")
      .select(
        `*,
         agent:profiles!leads_assigned_agent_fkey(
           id,
           employee_id,
           full_name,
           username
         )`
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("getLeads QA error:", error);
      return [];
    }

    return enrichLeadPeople(data ?? []);
  }

  /*
   * ADMIN / SUPER ADMIN / CLOSER
   *
   * Existing behavior: approved leads only.
   */
  const { data, error } = await supabase
    .from("leads")
    .select(
      `*,
       agent:profiles!leads_assigned_agent_fkey(
         id,
         employee_id,
         full_name,
         username
       )`
    )
    .eq("approval_status", "Approved")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("getLeads:", error);
    return [];
  }

  return enrichLeadPeople(data ?? []);
}

/* ===========================
   GET SINGLE LEAD
=========================== */

export async function getLead(id: number) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const client = profile?.role === "QA" ? adminSupabase : supabase;

  const { data, error } = await client
    .from("leads")
    .select(
      `*,
       agent:profiles!leads_assigned_agent_fkey(
         id,
         employee_id,
         full_name,
         username
       )`
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("getLead:", error);
    return null;
  }

  const enriched = await enrichLeadPeople([data]);
  return enriched[0] ?? data;
}

/* ===========================
   GET PENDING APPROVALS
=========================== */

export async function getPendingApprovals() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("getPendingApprovals: No authenticated user");
    return [];
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error(
      "getPendingApprovals profile error:",
      profileError
    );
    return [];
  }

  if (
    !profile ||
    !["Admin", "Super Admin"].includes(profile.role)
  ) {
    console.error(
      "getPendingApprovals: Access denied",
      profile?.role
    );
    return [];
  }

  // Management page: use the service-role client after authenticating the
  // current Admin/Super Admin so RLS cannot hide pending rows or make this
  // page disagree with the dashboard Pending Approval count.
  const { data, error } = await adminSupabase
    .from("leads")
    .select(
      `*,
       agent:profiles!leads_assigned_agent_fkey(
         id,
         employee_id,
         full_name,
         username
       )`
    )
    .eq("approval_status", "Pending")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "getPendingApprovals DATABASE ERROR:",
      error
    );
    return [];
  }

  return enrichLeadPeople(data ?? []);
}


/* ===========================
   GET AGENT LEADS
=========================== */

export async function getAgentLeads(agentId: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("getAgentLeads profile error:", profileError);
    return [];
  }

  // This page is an admin/management view. Agents may only see
  // their own leads; management roles can view the selected agent.
  if (profile.role === "Agent" && user.id !== agentId) {
    console.error("getAgentLeads: Access denied");
    return [];
  }

  if (
    profile.role !== "Agent" &&
    !["Admin", "Super Admin", "QA"].includes(profile.role)
  ) {
    console.error("getAgentLeads: Access denied", profile.role);
    return [];
  }

  const client =
    profile.role === "QA" || profile.role === "Admin" || profile.role === "Super Admin"
      ? adminSupabase
      : supabase;

  const { data, error } = await client
    .from("leads")
    .select(
      `*,
       agent:profiles!leads_assigned_agent_fkey(
         id,
         employee_id,
         full_name,
         username
       )`
    )
    .eq("assigned_agent", agentId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("getAgentLeads:", error);
    return [];
  }

  return enrichLeadPeople(data ?? []);
}

/* ===========================
   ADD LEAD
=========================== */

export async function addLead(lead: any) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .insert([lead])
    .select()
    .single();

  if (error) {
    console.error("addLead error:", error);
    throw error;
  }

  return data;
}

/* ===========================
   UPDATE LEAD
=========================== */

export async function updateLead(
  id: number,
  lead: any
) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .update(lead)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateLead error:", error);
    throw error;
  }

  return data;
}

/* ===========================
   DELETE LEAD
=========================== */

export async function deleteLead(id: number) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["Admin", "Super Admin"].includes(profile.role)
  ) {
    throw new Error(
      "Access Denied: Only Admins can delete leads."
    );
  }

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}
