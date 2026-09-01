"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { useLeadsRealtime } from "@/lib/useLeadsRealtime";

import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Phone,
  Search,
  Loader2,
  AlertCircle,
  PhoneCall,
  MapPin,
  Zap,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

interface Lead {
  id: number;
  lead_id: string | null;
  customer_name: string | null;
  mobile: string | null;
  alternate_mobile?: string | null;
  email?: string | null;
  state?: string | null;
  postcode?: string | null;
  suburb?: string | null;

  fuel_type?: string | null;
  current_retailer?: string | null;
  offered_retailer?: string | null;

  campaign?: string | null;

  status?: string | null;
  approval_status?: string | null;
  assignment_status?: string | null;

  assigned_closer?: string | null;
  assigned_at?: string | null;

  callback_date?: string | null;
  callback_time?: string | null;

  qa_status?: string | null;
}

interface ApiResponse {
  success: boolean;
  leads?: Lead[];
  count?: number;
  message?: string;
}

function CloserSalesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // This page's data comes from an already-protected API route, but the
  // page shell itself has no guard — redirect anyone who shouldn't be here.
  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (
        !profile ||
        !["Closer", "Admin", "Super Admin"].includes(profile.role)
      ) {
        router.replace("/unauthorized");
      }
    }

    checkAccess();
  }, [router]);

  const statusFilter =
    searchParams.get("status")?.toLowerCase() || "";

  const isFollowupView =
    statusFilter === "followup";

  const isReadyView =
    statusFilter === "ready";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadAssignedSales() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/closer/sales",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text = await response.text();

      let data: ApiResponse;

      try {
        data = JSON.parse(text);
      } catch {
        console.error(
          "Invalid JSON returned by API:",
          text
        );

        throw new Error(
          "The server returned an invalid response. Please check the API route."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load assigned sales."
        );
      }

      setLeads(data.leads || []);
    } catch (err: any) {
      console.error(
        "Assigned sales error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load assigned sales."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignedSales();
  }, []);

  useLeadsRealtime(loadAssignedSales);

  /*
   * =====================================================
   * STATUS FILTER
   * =====================================================
   *
   * Assigned:
   * Show all active leads.
   * Hide Sold and Lost.
   *
   * Ready:
   * Show only leads with status:
   * Assigned / Ready / New.
   *
   * Follow-up:
   * Show ONLY Follow-up leads.
   */

  const statusFilteredLeads = leads.filter(
    (lead) => {
      const status = String(
        lead.status || ""
      ).toLowerCase();

      if (isFollowupView) {
        return status === "follow-up";
      }

      if (isReadyView) {
        return (
          status === "assigned" ||
          status === "ready" ||
          status === "new"
        );
      }

      return (
        status !== "sold" &&
        status !== "lost"
      );
    }
  );

  /*
   * =====================================================
   * SEARCH FILTER
   * =====================================================
   */

  const filteredLeads =
    statusFilteredLeads.filter((lead) => {
      const searchText =
        search.toLowerCase().trim();

      if (!searchText) {
        return true;
      }

      return (
        String(lead.id)
          .toLowerCase()
          .includes(searchText) ||
        (lead.lead_id || "")
          .toLowerCase()
          .includes(searchText) ||
        (lead.customer_name || "")
          .toLowerCase()
          .includes(searchText) ||
        (lead.mobile || "")
          .toLowerCase()
          .includes(searchText) ||
        (lead.email || "")
          .toLowerCase()
          .includes(searchText) ||
        (lead.current_retailer || "")
          .toLowerCase()
          .includes(searchText) ||
        (lead.campaign || "")
          .toLowerCase()
          .includes(searchText)
      );
    });

  /*
   * =====================================================
   * FORMAT CALLBACK DATE
   * =====================================================
   */

  function formatCallbackDate(
    date?: string | null,
    time?: string | null
  ) {
    if (!date) {
      return null;
    }

    try {
      const datePart = new Date(
        `${date}T00:00:00`
      );

      const formattedDate =
        datePart.toLocaleDateString(
          "en-AU",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );

      if (!time) {
        return formattedDate;
      }

      return `${formattedDate} at ${time}`;
    } catch {
      return `${date}${time ? ` at ${time}` : ""}`;
    }
  }

  /*
   * =====================================================
   * LOCATION
   * =====================================================
   */

  function getLocation(lead: Lead) {
    const parts = [
      lead.suburb,
      lead.state,
      lead.postcode,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" ");
    }

    if (lead.state || lead.postcode) {
      return [
        lead.state,
        lead.postcode,
      ]
        .filter(Boolean)
        .join(" ");
    }

    return "Location not specified";
  }

  /*
   * =====================================================
   * CAMPAIGN
   * =====================================================
   */

  function getCampaign(lead: Lead) {
    return (
      lead.campaign ||
      "Campaign"
    );
  }

  /*
   * =====================================================
   * PAGE
   * =====================================================
   */

  return (
    <MainLayout>
      <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">

          {/* =====================================================
              HEADER
          ====================================================== */}

          <div className="mb-5">

            <Link
              href="/closer"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

              <div>

                <div className="flex items-center gap-3">

                  {(isFollowupView ||
                    isReadyView) && (
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                        isFollowupView
                          ? "bg-orange-100 text-orange-600"
                          : "bg-emerald-100 text-emerald-600"
                      }`}
                    >
                      {isFollowupView ? (
                        <PhoneCall size={22} />
                      ) : (
                        <CheckCircle size={22} />
                      )}
                    </div>
                  )}

                  <div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                      {isFollowupView
                        ? "Follow-up Leads"
                        : isReadyView
                        ? "Ready Leads"
                        : "My Leads"}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                      {isFollowupView
                        ? "Leads requiring a follow-up."
                        : isReadyView
                        ? "Leads ready for you to process."
                        : "Leads assigned to you for closing."}
                    </p>

                  </div>

                </div>

              </div>

              {/* TOTAL */}

              <div
                className={`rounded-xl border px-5 py-3 ${
                  isFollowupView
                    ? "border-orange-200 bg-orange-50"
                    : isReadyView
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-blue-200 bg-blue-50"
                }`}
              >

                <div
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    isFollowupView
                      ? "text-orange-600"
                      : isReadyView
                      ? "text-emerald-600"
                      : "text-blue-600"
                  }`}
                >
                  {isFollowupView
                    ? "Total Follow-up Leads"
                    : isReadyView
                    ? "Total Ready Leads"
                    : "Total Assigned Leads"}
                </div>

                <div
                  className={`mt-0.5 text-2xl font-bold ${
                    isFollowupView
                      ? "text-orange-600"
                      : isReadyView
                      ? "text-emerald-600"
                      : "text-blue-600"
                  }`}
                >
                  {loading
                    ? "—"
                    : statusFilteredLeads.length}
                </div>

              </div>

            </div>

          </div>

          {/* =====================================================
              SEARCH
          ====================================================== */}

          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">

            <div className="relative">

              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder={
                  isFollowupView
                    ? "Search follow-up leads, customer, mobile, Lead ID..."
                    : isReadyView
                    ? "Search ready leads, customer, mobile, Lead ID..."
                    : "Search leads, customer, mobile, Lead ID..."
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />

            </div>

          </div>

          {/* =====================================================
              LOADING
          ====================================================== */}

          {loading && (
            <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col items-center gap-3 text-slate-500">

                <Loader2
                  size={30}
                  className="animate-spin text-blue-600"
                />

                <p className="text-sm">
                  {isFollowupView
                    ? "Loading follow-up leads..."
                    : isReadyView
                    ? "Loading ready leads..."
                    : "Loading assigned leads..."}
                </p>

              </div>

            </div>
          )}

          {/* =====================================================
              ERROR
          ====================================================== */}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-white p-8 shadow-sm">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <AlertCircle size={23} />
                </div>

                <div>

                  <h2 className="font-bold text-red-700">
                    Unable to load sales
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {error}
                  </p>

                  <button
                    onClick={
                      loadAssignedSales
                    }
                    className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Try Again
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* =====================================================
              EMPTY
          ====================================================== */}

          {!loading &&
            !error &&
            filteredLeads.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">

                  {isFollowupView ? (
                    <PhoneCall
                      size={27}
                      className="text-orange-500"
                    />
                  ) : isReadyView ? (
                    <CheckCircle
                      size={27}
                      className="text-emerald-500"
                    />
                  ) : (
                    <CheckCircle
                      size={27}
                      className="text-blue-500"
                    />
                  )}

                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-800">
                  {isFollowupView
                    ? "No Follow-up Leads"
                    : isReadyView
                    ? "No Ready Leads"
                    : "No Assigned Leads"}
                </h2>

                <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                  {isFollowupView
                    ? "There are currently no leads requiring a follow-up."
                    : isReadyView
                    ? "There are currently no leads ready to process."
                    : "There are currently no active leads assigned to you."}
                </p>

              </div>
            )}

          {/* =====================================================
              LEAD LIST
          ====================================================== */}

          {!loading &&
            !error &&
            filteredLeads.length > 0 && (
              <div className="space-y-3">

                {filteredLeads.map((lead) => {

                  const callbackDate =
                    formatCallbackDate(
                      lead.callback_date,
                      lead.callback_time
                    );

                  const isCallback =
                    String(
                      lead.status || ""
                    ).toLowerCase() ===
                    "follow-up";

                  return (
                    <div
                      key={lead.id}
                      className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition duration-200 hover:-translate-y-[1px] hover:shadow-md ${
                        isCallback
                          ? "border-orange-200"
                          : "border-slate-200"
                      }`}
                    >

                      {/* COLOURED LEFT BORDER */}

                      <div
                        className={`absolute inset-y-0 left-0 w-1 ${
                          isCallback
                            ? "bg-orange-400"
                            : "bg-blue-500"
                        }`}
                      />

                      <div className="p-4 pl-5 sm:p-5 sm:pl-6">

                        {/* =================================================
                            TOP ROW
                        ================================================== */}

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                          {/* CUSTOMER */}

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              {/* CAMPAIGN */}

                              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                                {getCampaign(lead)}
                              </span>

                              {/* STATUS */}

                              {isCallback ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-700">
                                  <PhoneCall
                                    size={12}
                                  />
                                  Follow-up
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                                  <CheckCircle
                                    size={12}
                                  />
                                  {isReadyView
                                    ? "Ready"
                                    : "Assigned"}
                                </span>
                              )}

                            </div>

                            {/* NAME + LEAD ID */}

                            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:gap-8">

                              <div className="min-w-0">

                                <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                                  {lead.customer_name ||
                                    "Unknown Customer"}
                                </h2>

                                {lead.mobile && (
                                  <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                                    <Phone
                                      size={14}
                                      className="text-blue-500"
                                    />
                                    {lead.mobile}
                                  </div>
                                )}

                              </div>

                              <div className="hidden h-8 w-px bg-slate-200 md:block" />

                              <div>

                                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                  Lead ID
                                </div>

                                <div className="mt-0.5 font-semibold text-slate-800">
                                  {lead.lead_id ||
                                    `#${lead.id}`}
                                </div>

                              </div>

                            </div>

                          </div>

                          {/* PROCESS BUTTON */}

                          <div className="shrink-0">

                            <Link
                              href={`/closer/sales/${lead.id}`}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md lg:w-auto"
                            >
                              Process Lead
                              <ArrowRight
                                size={17}
                              />
                            </Link>

                          </div>

                        </div>

                        {/* =================================================
                            INFORMATION ROW
                        ================================================== */}

                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-slate-100 pt-4 md:grid-cols-4">

                          {/* MOBILE */}

                          <div className="flex min-w-0 items-center gap-2.5">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <Phone size={16} />
                            </div>

                            <div className="min-w-0">

                              <div className="text-[11px] font-medium text-slate-400">
                                Mobile
                              </div>

                              <div className="truncate text-sm font-semibold text-slate-800">
                                {lead.mobile ||
                                  "Not available"}
                              </div>

                            </div>

                          </div>

                          {/* FUEL */}

                          <div className="flex min-w-0 items-center gap-2.5">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                              <Zap size={16} />
                            </div>

                            <div className="min-w-0">

                              <div className="text-[11px] font-medium text-slate-400">
                                Fuel Type
                              </div>

                              <div className="truncate text-sm font-semibold text-slate-800">
                                {lead.fuel_type ||
                                  "Not specified"}
                              </div>

                            </div>

                          </div>

                          {/* RETAILER */}

                          <div className="flex min-w-0 items-center gap-2.5">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                              <Zap size={16} />
                            </div>

                            <div className="min-w-0">

                              <div className="text-[11px] font-medium text-slate-400">
                                Retailer
                              </div>

                              <div className="truncate text-sm font-semibold text-slate-800">
                                {lead.current_retailer ||
                                  "Not specified"}
                              </div>

                            </div>

                          </div>

                          {/* LOCATION */}

                          <div className="flex min-w-0 items-center gap-2.5">

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                              <MapPin size={16} />
                            </div>

                            <div className="min-w-0">

                              <div className="text-[11px] font-medium text-slate-400">
                                Location
                              </div>

                              <div className="truncate text-sm font-semibold text-slate-800">
                                {getLocation(
                                  lead
                                )}
                              </div>

                            </div>

                          </div>

                        </div>

                        {/* =================================================
                            FOLLOW-UP STRIP
                        ================================================== */}

                        {isCallback && (
                          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex items-center gap-3">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm">
                                <Clock
                                  size={18}
                                />
                              </div>

                              <div>

                                <div className="text-[11px] font-bold uppercase tracking-wide text-orange-600">
                                  Follow-up Due
                                </div>

                                <div className="text-sm font-bold text-orange-800">
                                  {callbackDate ||
                                    "Follow-up scheduled"}
                                </div>

                              </div>

                            </div>

                            <div className="text-xs font-semibold text-orange-600">
                              Follow-up required
                            </div>

                          </div>
                        )}

                        {/* =================================================
                            FOOTER
                        ================================================== */}

                        <div className="mt-3 flex items-center justify-between">

                          <div className="flex items-center gap-1.5 text-xs text-slate-400">

                            <CalendarDays
                              size={13}
                            />

                            Created{" "}
                            {lead.assigned_at
                              ? new Date(
                                  lead.assigned_at
                                ).toLocaleDateString(
                                  "en-AU",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : "—"}

                          </div>

                          {isCallback && (
                            <span className="text-xs font-medium text-orange-500">
                              Follow-up
                            </span>
                          )}

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

        </div>
      </div>
    </MainLayout>
  );
}

export default function CloserSalesPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
            <div className="text-sm text-slate-500">
              Loading closer sales...
            </div>
          </div>
        </MainLayout>
      }
    >
      <CloserSalesContent />
    </Suspense>
  );
}
