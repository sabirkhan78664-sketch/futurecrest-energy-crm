import { adminSupabase } from "@/lib/admin";
import { getZonedTodayStart } from "@/lib/timezone";

// =========================
// PERIOD FILTER
// =========================

function getPeriodStart(period: string): string | null {
  const now = new Date();

  if (period === "today") {
    return getZonedTodayStart(
      "Asia/Kolkata"
    ).toISOString();
  }

  if (period === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);

    return start.toISOString();
  }

  if (period === "month") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);

    return start.toISOString();
  }

  return null;
}

function applyPeriod(query: any, periodStart: string | null) {
  return periodStart
    ? query.gte("created_at", periodStart)
    : query;
}

// Sales (and other outcome-based counts) must bucket by when the Closer
// actually recorded the outcome (closed_at), not by created_at — an old
// lead sold today is a today's sale, not a sale from whenever it was
// first created.
function applyClosedPeriod(query: any, periodStart: string | null) {
  return periodStart
    ? query.gte("closed_at", periodStart)
    : query;
}

export async function getDashboardMetrics(
  period: string = "all"
) {
  // Dashboard metrics are management-wide metrics. Use the service-role
  // client so RLS cannot make the Pending Approval count differ from the
  // actual Pending Approvals page for Admin/Super Admin.
  const supabase = adminSupabase;

  const periodStart = getPeriodStart(period);

  const [
    totalResult,
    pendingResult,
    unassignedResult,
    assignedResult,
    salesResult,
    qaRejectedResult,
    rejectedLostResult,
    energyResult,
    phiResult,
    nbnResult,
    retailerDataResult,
    salesTrendResult,
  ] = await Promise.all([
    // =========================
    // TOTAL LEADS
    // =========================
    applyPeriod(
      supabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        }),
      periodStart
    ),

    // =========================
    // PENDING APPROVALS
    // =========================
    applyPeriod(
      supabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("approval_status", "Pending"),
      periodStart
    ),

    // =========================
    // UNCLAIMED (no closer has taken the lead yet)
    // =========================
    applyPeriod(
      supabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("approval_status", "Approved")
        .is("assigned_closer", null),
      periodStart
    ),

    // =========================
    // CLAIMED (a closer has taken the lead via Take Lead)
    // =========================
    applyPeriod(
      supabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("approval_status", "Approved")
        .not("assigned_closer", "is", null),
      periodStart
    ),

    // =========================
    // SOLD
    // IMPORTANT:
    // Closer workflow uses "Sold" NOT "Sale". Counts every Sold lead —
    // matches the QA dashboard's "Sold Leads" total. QA Rejected is
    // shown as its own separate metric, not subtracted from this one.
    // Bucketed by closed_at (when it was marked Sold), not created_at —
    // an old lead closed today is today's sale.
    // =========================
    applyClosedPeriod(
      supabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("status", "Sold"),
      periodStart
    ),

    // =========================
    // QA REJECTED
    // =========================
    supabase
      .from("leads")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "Sold")
      .eq("qa_status", "Rejected"),

    // =========================
    // REJECTED / LOST
    // A lead the Closer marked Lost, or one rejected in the approval
    // workflow — distinct from QA Rejected, which only covers Sold
    // leads that failed post-sale audit. Bucketed by closed_at, same
    // as Sold — Lost also sets closed_at when a Closer records it.
    // =========================
    applyClosedPeriod(
      supabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .or("status.eq.Lost,approval_status.eq.Rejected"),
      periodStart
    ),

    // =========================
    // LEADS BY CAMPAIGN
    // =========================
    applyPeriod(
      supabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("campaign", "Energy"),
      periodStart
    ),

    applyPeriod(
      supabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("campaign", "PHI"),
      periodStart
    ),

    applyPeriod(
      supabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("campaign", "NBN"),
      periodStart
    ),

    // =========================
    // SALES BY OFFERED RETAILER
    // =========================
    applyClosedPeriod(
      supabase
        .from("leads")
        .select("offered_retailer")
        .eq("status", "Sold"),
      periodStart
    ),

    // =========================
    // SALES TREND (last 14 days)
    // =========================
    supabase
      .from("leads")
      .select("closed_at, status, qa_status")
      .eq("status", "Sold")
      .neq("qa_status", "Rejected")
      .gte(
        "closed_at",
        new Date(
          Date.now() - 14 * 24 * 60 * 60 * 1000
        ).toISOString()
      )
      .order("closed_at", { ascending: true }),
  ]);

  // =========================
  // ERROR LOGGING
  // =========================

  if (totalResult.error) {
    console.error(
      "DASHBOARD TOTAL LEADS ERROR:",
      totalResult.error
    );
  }

  if (pendingResult.error) {
    console.error(
      "DASHBOARD PENDING APPROVAL ERROR:",
      pendingResult.error
    );
  }

  if (unassignedResult.error) {
    console.error(
      "DASHBOARD UNASSIGNED LEADS ERROR:",
      unassignedResult.error
    );
  }

  if (assignedResult.error) {
    console.error(
      "DASHBOARD ASSIGNED LEADS ERROR:",
      assignedResult.error
    );
  }

  if (salesResult.error) {
    console.error(
      "DASHBOARD SOLD LEADS ERROR:",
      salesResult.error
    );
  }

  if (qaRejectedResult.error) {
    console.error(
      "DASHBOARD QA REJECTED ERROR:",
      qaRejectedResult.error
    );
  }

  if (rejectedLostResult.error) {
    console.error(
      "DASHBOARD REJECTED / LOST ERROR:",
      rejectedLostResult.error
    );
  }

  if (energyResult.error) {
    console.error(
      "DASHBOARD ENERGY LEADS ERROR:",
      energyResult.error
    );
  }

  if (phiResult.error) {
    console.error(
      "DASHBOARD PHI LEADS ERROR:",
      phiResult.error
    );
  }

  if (nbnResult.error) {
    console.error(
      "DASHBOARD NBN LEADS ERROR:",
      nbnResult.error
    );
  }

  if (retailerDataResult.error) {
    console.error(
      "DASHBOARD RETAILER BREAKDOWN ERROR:",
      retailerDataResult.error
    );
  }

  if (salesTrendResult.error) {
    console.error(
      "DASHBOARD SALES TREND ERROR:",
      salesTrendResult.error
    );
  }

  // =========================
  // COUNTS
  // =========================

  const totalLeads =
    totalResult.count ?? 0;

  const pendingApprovals =
    pendingResult.count ?? 0;

  const unassignedLeads =
    unassignedResult.count ?? 0;

  const assignedLeads =
    assignedResult.count ?? 0;

  const sales =
    salesResult.count ?? 0;

  const qaRejected =
    qaRejectedResult.count ?? 0;

  const rejectedLost =
    rejectedLostResult.count ?? 0;

  const energyLeads =
    energyResult.count ?? 0;

  const phiLeads =
    phiResult.count ?? 0;

  const nbnLeads =
    nbnResult.count ?? 0;

  // =========================
  // CONVERSION RATE
  // =========================

  const conversionRate =
    totalLeads > 0
      ? (sales / totalLeads) * 100
      : 0;

  // =========================
  // SALES BY OFFERED RETAILER
  // =========================

  const retailerCounts = new Map<string, number>();

  (retailerDataResult.data ?? []).forEach(
    (row: any) => {
      const name = String(
        row.offered_retailer || ""
      ).trim();

      if (!name) return;

      retailerCounts.set(
        name,
        (retailerCounts.get(name) || 0) + 1
      );
    }
  );

  const retailerBreakdown = [
    ...retailerCounts.entries(),
  ]
    .map(([name, count]) => ({
      name,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // =========================
  // TOP PERFORMING AGENTS
  // =========================

  const { data: agentLeadsData, error: agentLeadsError } =
    await supabase
      .from("leads")
      .select(
        `
        assigned_agent,
        status,
        agent:profiles!leads_assigned_agent_fkey(
          id,
          employee_id,
          full_name
        )
      `
      );

  if (agentLeadsError) {
    console.error(
      "DASHBOARD TOP AGENTS ERROR:",
      agentLeadsError
    );
  }

  const agentPerformance = new Map<
    string,
    {
      id: string;
      employee_id: string;
      full_name: string;
      leads: number;
      sales: number;
    }
  >();

  (agentLeadsData ?? []).forEach((row: any) => {
    const agent = Array.isArray(row.agent)
      ? row.agent[0]
      : row.agent;

    if (!agent) return;

    if (!agentPerformance.has(agent.id)) {
      agentPerformance.set(agent.id, {
        id: agent.id,
        employee_id: agent.employee_id,
        full_name: agent.full_name,
        leads: 0,
        sales: 0,
      });
    }

    const entry = agentPerformance.get(agent.id)!;

    entry.leads += 1;

    if (
      String(row.status || "").toLowerCase() ===
      "sold"
    ) {
      entry.sales += 1;
    }
  });

  const topAgents = [...agentPerformance.values()]
    .map((agent) => ({
      ...agent,
      conversionRate:
        agent.leads > 0
          ? (agent.sales / agent.leads) * 100
          : 0,
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);

  // =========================
  // SALES TREND (last 14 days)
  // =========================
  // Day keys are bucketed in the business's own timezone (Asia/Kolkata),
  // not the UTC date slice() previously pulled straight off the raw
  // timestamp — a sale closed during IST's morning would otherwise be
  // attributed to the previous UTC day, showing up a day early.

  const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const salesByDay: Record<string, number> = {};

  for (const lead of salesTrendResult.data || []) {
    if (!lead.closed_at) continue;

    const day = dayKeyFormatter.format(
      new Date(lead.closed_at)
    );
    salesByDay[day] = (salesByDay[day] || 0) + 1;
  }

  const salesTrend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const date = dayKeyFormatter.format(d);

    return {
      date,
      label: d.toLocaleDateString("en-AU", {
        weekday: "short",
        timeZone: "Asia/Kolkata",
      }),
      dayNum: Number(date.slice(8, 10)),
      isToday: i === 13,
      count: salesByDay[date] || 0,
    };
  });

  const salesTrend14dTotal = salesTrend.reduce(
    (sum, day) => sum + day.count,
    0
  );

  const salesTrendBestDay = salesTrend.reduce((a, b) =>
    b.count > a.count ? b : a
  );

  const salesTrendAvgDaily =
    salesTrend14dTotal > 0
      ? (salesTrend14dTotal / 14).toFixed(1)
      : "0.0";

  return {
    totalLeads,
    pendingApprovals,
    unassignedLeads,
    assignedLeads,
    sales,
    conversionRate,
    topAgents,
    qaRejected,
    rejectedLost,
    energyLeads,
    phiLeads,
    nbnLeads,
    retailerBreakdown,
    salesTrend,
    salesTrend14dTotal,
    salesTrendBestDay,
    salesTrendAvgDaily,
  };
}
