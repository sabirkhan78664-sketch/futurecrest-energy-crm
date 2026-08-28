"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLeadsRealtime } from "@/lib/useLeadsRealtime";
import {
  ArrowLeft,
  Search,
  XCircle,
  Eye,
} from "lucide-react";

interface Lead {
  id: number;
  lead_id: string | null;
  customer_name: string | null;
  mobile: string | null;
  email: string | null;
  status: string | null;
  comments: string | null;
  closed_at: string | null;
  assigned_closer: string | null;
}

export default function CloserLostPage() {
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

  async function loadLostLeads() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/closer/sales", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load lost leads."
        );
      }

      const lostLeads = (data.leads || []).filter(
        (lead: Lead) =>
          String(lead.status || "").toLowerCase() === "lost"
      );

      setLeads(lostLeads);
    } catch (err) {
      console.error("CLOSER LOST LEADS ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load lost leads."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLostLeads();
  }, []);

  useLeadsRealtime(loadLostLeads);

  const filteredLeads = leads.filter((lead) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return true;
    }

    return (
      String(lead.lead_id || "")
        .toLowerCase()
        .includes(searchText) ||
      String(lead.customer_name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(lead.mobile || "")
        .toLowerCase()
        .includes(searchText) ||
      String(lead.email || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/closer"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                <XCircle size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Lost Leads
                </h1>

                <p className="text-sm text-slate-500">
                  Leads marked as lost by you
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-red-100 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Total Lost
            </p>

            <p className="text-2xl font-bold text-red-600">
              {loading ? "—" : leads.length}
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Lead ID, customer, mobile or email..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading lost leads...
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && filteredLeads.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <XCircle
              size={42}
              className="mx-auto mb-3 text-slate-300"
            />

            <h2 className="text-lg font-semibold text-slate-700">
              No Lost Leads
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              There are no lost leads matching your search.
            </p>
          </div>
        )}

        {/* TABLE */}
        {!loading && filteredLeads.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lead ID
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Mobile
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lost Date
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-900">
                          {lead.lead_id || `#${lead.id}`}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-800">
                          {lead.customer_name || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {lead.mobile || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {lead.email || "—"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {lead.closed_at
                          ? new Date(
                              lead.closed_at
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/closer/sales/${lead.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <Eye size={16} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}