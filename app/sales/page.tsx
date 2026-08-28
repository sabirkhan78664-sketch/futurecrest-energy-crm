"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import MainLayout from "@/components/layout/MainLayout";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  User,
  Phone,
  MapPin,
  Zap,
} from "lucide-react";

interface Lead {
  id: number;
  lead_id?: string | null;
  customer_name: string | null;
  mobile: string | null;
  alternate_mobile?: string | null;
  email?: string | null;
  address?: string | null;
  state?: string | null;
  postcode?: string | null;

  campaign?: string | null;
  fuel_type?: string | null;
  current_retailer?: string | null;
  offered_retailer?: string | null;

  nmi?: string | null;
  mirn?: string | null;

  status?: string | null;
  approval_status?: string | null;

  assigned_agent?: string | null;
  assigned_closer?: string | null;

  callback_date?: string | null;
  callback_time?: string | null;

  comments?: string | null;

  created_at?: string | null;
}

export default function AssignedSalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  async function loadAssignedSales(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      /*
       * GET CURRENT USER
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
        throw userError;
      }

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setCurrentUserId(user.id);

      /*
       * GET ONLY:
       * 1. Leads assigned to this Closer
       * 2. Approved leads
       */
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id,
          lead_id,
          customer_name,
          mobile,
          alternate_mobile,
          email,
          address,
          state,
          postcode,
          campaign,
          fuel_type,
          current_retailer,
          offered_retailer,
          nmi,
          mirn,
          status,
          approval_status,
          assigned_agent,
          assigned_closer,
          callback_date,
          callback_time,
          comments,
          created_at
        `)
        .eq("assigned_closer", user.id)
        .eq("approval_status", "Approved")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Assigned sales error:", error);
        throw error;
      }

      /*
       * Don't show already completed leads.
       */
      const activeLeads = (data || []).filter(
        (lead: Lead) => {
          const status =
            lead.status?.toLowerCase() || "";

          return (
            status !== "sold" &&
            status !== "lost" &&
            status !== "completed"
          );
        }
      );

      setLeads(activeLeads);
      setFilteredLeads(activeLeads);
    } catch (error: any) {
      console.error(error);

      alert(
        error?.message ||
          "Unable to load assigned sales."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /*
   * INITIAL LOAD
   */
  useEffect(() => {
    loadAssignedSales();
  }, []);

  /*
   * SEARCH
   */
  useEffect(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      setFilteredLeads(leads);
      return;
    }

    const result = leads.filter((lead) => {
      return (
        lead.customer_name
          ?.toLowerCase()
          .includes(keyword) ||

        lead.mobile
          ?.toLowerCase()
          .includes(keyword) ||

        lead.lead_id
          ?.toLowerCase()
          .includes(keyword) ||

        lead.nmi
          ?.toLowerCase()
          .includes(keyword) ||

        lead.campaign
          ?.toLowerCase()
          .includes(keyword)
      );
    });

    setFilteredLeads(result);
  }, [search, leads]);

  function getStatusStyle(status?: string | null) {
    switch (status?.toLowerCase()) {
      case "callback":
        return "bg-orange-100 text-orange-700";

      case "approved":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-blue-100 text-blue-700";
    }
  }

  function formatDate(date?: string | null) {
    if (!date) return "-";

    try {
      return new Date(date).toLocaleDateString(
        "en-AU",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return date;
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* =========================================
            HEADER
        ========================================= */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div className="flex items-center gap-4">

            <Link
              href="/closer"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Assigned Sales
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Approved leads assigned to you.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              loadAssignedSales(true)
            }
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

        {/* =========================================
            SUMMARY
        ========================================= */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Assigned Leads
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-800">
                  {leads.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <CheckCircle size={24} />
              </div>

            </div>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Callbacks
                </p>

                <p className="mt-1 text-3xl font-bold text-orange-600">
                  {
                    leads.filter(
                      (lead) =>
                        lead.status?.toLowerCase() ===
                        "callback"
                    ).length
                  }
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Clock size={24} />
              </div>

            </div>

          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Ready to Process
                </p>

                <p className="mt-1 text-3xl font-bold text-emerald-600">
                  {
                    leads.filter(
                      (lead) =>
                        lead.status?.toLowerCase() !==
                        "callback"
                    ).length
                  }
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Zap size={24} />
              </div>

            </div>

          </div>

        </div>

        {/* =========================================
            SEARCH
        ========================================= */}

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="relative">

            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search customer, mobile, Lead ID or NMI..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

          </div>

        </div>

        {/* =========================================
            LOADING
        ========================================= */}

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-4 text-sm text-slate-500">
              Loading your assigned sales...
            </p>

          </div>
        )}

        {/* =========================================
            EMPTY
        ========================================= */}

        {!loading &&
          filteredLeads.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">

              <CheckCircle
                size={48}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-lg font-semibold text-slate-700">
                No assigned sales
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                You currently have no approved
                leads assigned to you.
              </p>

            </div>
          )}

        {/* =========================================
            LEAD CARDS
        ========================================= */}

        {!loading &&
          filteredLeads.length > 0 && (

            <div className="space-y-4">

              {filteredLeads.map((lead) => (

                <div
                  key={lead.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >

                  {/* TOP */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          {lead.campaign || "Campaign"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(
                            lead.status
                          )}`}
                        >
                          {lead.status || "Approved"}
                        </span>

                      </div>

                      <h2 className="mt-3 text-xl font-bold text-slate-800">
                        {lead.customer_name ||
                          "Unknown Customer"}
                      </h2>

                      <p className="mt-1 text-xs text-slate-400">
                        Lead ID:{" "}
                        {lead.lead_id ||
                          lead.id}
                      </p>

                    </div>

                    <Link
                      href={`/closer/sales/${lead.id}`}
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      Process Lead
                    </Link>

                  </div>

                  {/* INFORMATION */}
                  <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2 lg:grid-cols-4">

                    <div className="flex items-start gap-3">

                      <Phone
                        size={18}
                        className="mt-0.5 text-slate-400"
                      />

                      <div>
                        <p className="text-xs text-slate-400">
                          Mobile
                        </p>

                        <p className="text-sm font-semibold text-slate-700">
                          {lead.mobile || "-"}
                        </p>
                      </div>

                    </div>

                    <div className="flex items-start gap-3">

                      <User
                        size={18}
                        className="mt-0.5 text-slate-400"
                      />

                      <div>
                        <p className="text-xs text-slate-400">
                          Fuel
                        </p>

                        <p className="text-sm font-semibold text-slate-700">
                          {lead.fuel_type || "-"}
                        </p>
                      </div>

                    </div>

                    <div className="flex items-start gap-3">

                      <Zap
                        size={18}
                        className="mt-0.5 text-slate-400"
                      />

                      <div>
                        <p className="text-xs text-slate-400">
                          Retailer
                        </p>

                        <p className="text-sm font-semibold text-slate-700">
                          {lead.offered_retailer ||
                            lead.current_retailer ||
                            "-"}
                        </p>
                      </div>

                    </div>

                    <div className="flex items-start gap-3">

                      <MapPin
                        size={18}
                        className="mt-0.5 text-slate-400"
                      />

                      <div>
                        <p className="text-xs text-slate-400">
                          Location
                        </p>

                        <p className="text-sm font-semibold text-slate-700">
                          {lead.state || "-"}{" "}
                          {lead.postcode || ""}
                        </p>
                      </div>

                    </div>

                  </div>

                  {/* NMI */}
                  {lead.nmi && (
                    <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3">

                      <span className="text-xs text-slate-400">
                        NMI
                      </span>

                      <span className="ml-3 text-sm font-semibold text-slate-700">
                        {lead.nmi}
                      </span>

                    </div>
                  )}

                  {/* CALLBACK */}
                  {lead.status?.toLowerCase() ===
                    "callback" &&
                    lead.callback_date && (
                      <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">

                        <div className="flex items-center gap-2">

                          <Clock
                            size={18}
                            className="text-orange-600"
                          />

                          <span className="text-sm font-semibold text-orange-800">
                            Callback:{" "}
                            {formatDate(
                              lead.callback_date
                            )}

                            {lead.callback_time
                              ? ` at ${lead.callback_time}`
                              : ""}
                          </span>

                        </div>

                      </div>
                    )}

                  {/* CREATED */}
                  <div className="mt-4 text-xs text-slate-400">
                    Created:{" "}
                    {formatDate(
                      lead.created_at
                    )}
                  </div>

                </div>

              ))}

            </div>
          )}

      </div>
    </MainLayout>
  );
}