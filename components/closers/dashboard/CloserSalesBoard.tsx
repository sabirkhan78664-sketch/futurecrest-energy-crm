"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLeadsRealtime } from "@/lib/useLeadsRealtime";

import {
  ClipboardList,
  CheckCircle,
  Trophy,
  PhoneCall,
  XCircle,
  ArrowRight,
} from "lucide-react";

interface Counts {
  assigned: number;
  ready: number;
  sold: number;
  callback: number;
  lost: number;
}

export default function CloserSalesBoard() {
  const [counts, setCounts] = useState<Counts>({
    assigned: 0,
    ready: 0,
    sold: 0,
    callback: 0,
    lost: 0,
  });

  const [loading, setLoading] = useState(true);

  async function loadCounts() {
    try {
      const response = await fetch("/api/closer/dashboard", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load dashboard"
        );
      }

      setCounts(data.counts);
    } catch (error) {
      console.error(
        "CLOSER SALES BOARD ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCounts();

    const interval = setInterval(
      loadCounts,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  useLeadsRealtime(loadCounts);

  const displayNumber = (value: number) =>
    loading ? "—" : value;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

      {/* =====================================================
          ASSIGNED
      ====================================================== */}
      <Link
        href="/closer/sales"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Assigned
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {displayNumber(counts.assigned)}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <ClipboardList size={24} />
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          View assigned leads
          <ArrowRight size={13} />
        </p>
      </Link>

      {/* =====================================================
          READY
      ====================================================== */}
      <Link
        href="/closer/sales?status=Ready"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Ready
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {displayNumber(counts.ready)}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle size={24} />
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Leads ready to process
        </p>
      </Link>

      {/* =====================================================
          SOLD
      ====================================================== */}
      <Link
        href="/closer/sold"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Sold
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {displayNumber(counts.sold)}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
            <Trophy size={24} />
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Completed sales
        </p>
      </Link>

      {/* =====================================================
          CALLBACK
      ====================================================== */}
      <Link
        href="/closer/sales?status=Callback"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Callback
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-500">
              {displayNumber(counts.callback)}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <PhoneCall size={24} />
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Follow-up required
        </p>
      </Link>

      {/* =====================================================
          LOST
      ====================================================== */}
      <Link
        href="/closer/lost"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Lost
            </p>

            <p className="mt-2 text-3xl font-bold text-red-600">
              {displayNumber(counts.lost)}
            </p>
          </div>

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <XCircle size={24} />
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Unsuccessful leads
        </p>
      </Link>

    </div>
  );
}