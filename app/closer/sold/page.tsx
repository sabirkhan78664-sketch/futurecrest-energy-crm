"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLeadsRealtime } from "@/lib/useLeadsRealtime";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Fuel,
  Phone,
  Search,
  User,
} from "lucide-react";

type SoldLead = {
  id: number;
  lead_id: string | null;
  customer_name: string | null;
  mobile: string | null;
  fuel_type: string | null;
  current_retailer: string | null;
  offered_retailer: string | null;
  status: string | null;
  comments: string | null;
  closed_at: string | null;
};

type ApiResponse = {
  success: boolean;
  leads?: SoldLead[];
  count?: number;
  closer?: {
    id: string;
    full_name: string;
    employee_id: string;
  };
  message?: string;
};

export default function CloserSoldPage() {
  const router = useRouter();

  const [leads, setLeads] = useState<SoldLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSoldLeads();
  }, []);

  useLeadsRealtime(loadSoldLeads);

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

  async function loadSoldLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/closer/sold", {
        method: "GET",
        cache: "no-store",
      });

      const text = await response.text();

      let data: ApiResponse;

      try {
        data = JSON.parse(text);
      } catch {
        console.error("Invalid API response:", text);

        throw new Error(
          "The Sold Leads API did not return valid JSON."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load sold leads."
        );
      }

      setLeads(data.leads || []);
    } catch (err: any) {
      console.error("Sold leads error:", err);
      setError(err?.message || "Unable to load sold leads.");
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return leads;
    }

    return leads.filter((lead) => {
      return (
        lead.customer_name?.toLowerCase().includes(term) ||
        lead.lead_id?.toLowerCase().includes(term) ||
        lead.mobile?.toLowerCase().includes(term) ||
        lead.fuel_type?.toLowerCase().includes(term) ||
        lead.current_retailer?.toLowerCase().includes(term) ||
        lead.offered_retailer?.toLowerCase().includes(term)
      );
    });
  }, [leads, search]);

  function formatDate(date: string | null) {
    if (!date) {
      return "—";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "—";
    }

    return value.toLocaleString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function display(value: string | null) {
    return value && value.trim() ? value : "—";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HEADER */}
        <div className="mb-6">
          <Link
            href="/closer/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={28} />
                </div>

                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Sold Leads
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Successfully completed sales.
                  </p>
                </div>
              </div>
            </div>

            {/* COUNT */}
            <div className="rounded-2xl border border-slate-200 bg-white px-7 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total Sold
              </p>

              <p className="mt-1 text-3xl font-bold text-emerald-600">
                {loading ? "..." : leads.length}
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, lead ID, mobile, retailer..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-red-600">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h2 className="font-bold text-red-700">
                  Unable to load sold leads
                </h2>

                <p className="mt-1 text-sm text-red-600">
                  {error}
                </p>

                <button
                  onClick={loadSoldLeads}
                  className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="font-medium text-slate-700">
              Loading sold leads...
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredLeads.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={34} />
            </div>

            <h2 className="text-xl font-bold text-slate-800">
              {search ? "No matching sold leads" : "No sold leads yet"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try a different search."
                : "Completed sales will appear here."}
            </p>
          </div>
        )}

        {/* SOLD LEADS */}
        {!loading && !error && filteredLeads.length > 0 && (
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  {/* CUSTOMER */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-900">
                        {display(lead.customer_name)}
                      </h2>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 size={14} />
                        SOLD
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Lead ID:{" "}
                      <span className="font-semibold text-slate-700">
                        {lead.lead_id
                          ? lead.lead_id
                          : `#${lead.id}`}
                      </span>
                    </p>
                  </div>

                  {/* SOLD DATE */}
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <Clock3
                      size={20}
                      className="text-emerald-600"
                    />

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Sold Date
                      </p>

                      <p className="text-sm font-semibold text-slate-700">
                        {formatDate(lead.closed_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DETAILS */}
                <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">

                  {/* MOBILE */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Phone size={19} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Mobile
                      </p>

                      <p className="text-sm font-semibold text-slate-700">
                        {display(lead.mobile)}
                      </p>
                    </div>
                  </div>

                  {/* FUEL */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                      <Fuel size={19} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Fuel Type
                      </p>

                      <p className="text-sm font-semibold text-slate-700">
                        {display(lead.fuel_type)}
                      </p>
                    </div>
                  </div>

                  {/* CURRENT RETAILER */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                      <User size={19} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Current Retailer
                      </p>

                      <p className="text-sm font-semibold text-slate-700">
                        {display(lead.current_retailer)}
                      </p>
                    </div>
                  </div>

                  {/* OFFERED RETAILER */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <CheckCircle2 size={19} />
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Offered Retailer
                      </p>

                      <p className="text-sm font-semibold text-slate-700">
                        {display(lead.offered_retailer)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* COMMENTS */}
                {lead.comments && (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Comments
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {lead.comments}
                    </p>
                  </div>
                )}

                {/* ACTION */}
                <div className="mt-5 flex justify-end">
                  <Link
                    href={`/closer/sales/${lead.id}`}
                    className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
                  >
                    View Lead
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}