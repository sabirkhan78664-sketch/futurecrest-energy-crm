import CloserSalesBoard from "@/components/closers/dashboard/CloserSalesBoard";
import MainLayout from "@/components/layout/MainLayout";
import StateClocks from "@/components/dashboard/StateClocks";
import { getCurrentUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

import {
  MessageSquare,
  CheckCircle,
  ClipboardList,
  ArrowRight,
  Plus,
} from "lucide-react";

export default async function CloserDashboard() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "Closer") {
    redirect("/login");
  }

  return (
    <MainLayout>
      <div className="space-y-6 p-2">

        {/* =====================================================
            WELCOME HEADER
        ====================================================== */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold">
            Welcome back, {profile.full_name}! 🚀
          </h1>

          <p className="mt-2 text-emerald-100">
            Ready to finalize some sales today?
          </p>
        </div>

        <StateClocks />

        {/* =====================================================
            TODAY'S SALES BOARD
        ====================================================== */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-slate-800">
            Today's Sales Board
          </h2>

          <CloserSalesBoard />
        </div>

        {/* =====================================================
            QUICK ACTIONS
        ====================================================== */}
        <div>
          <h2 className="mb-4 text-xl font-bold text-slate-800">
            Quick Actions
          </h2>

          <div className="grid gap-6 md:grid-cols-3">

            {/* NEW LEAD */}
            <Link
              href="/leads/new"
              className="group flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                <Plus size={32} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  New Lead
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Submit a new lead.
                </p>
              </div>

              <ArrowRight
                className="ml-auto text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                size={22}
              />
            </Link>

            {/* ASSIGNED LEADS */}
            <Link
              href="/closer/sales"
              className="group flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-500 hover:shadow-md"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white">
                <CheckCircle size={32} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Assigned Leads
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  View and process leads assigned to you.
                </p>
              </div>

              <ArrowRight
                className="ml-auto text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-600"
                size={22}
              />
            </Link>

            {/* MESSAGES */}
            <Link
              href="/messages"
              className="group flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                <MessageSquare size={32} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Messages
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Communicate with agents and admins.
                </p>
              </div>

              <ArrowRight
                className="ml-auto text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                size={22}
              />
            </Link>

          </div>
        </div>

        {/* =====================================================
            CLOSER WORKFLOW
        ====================================================== */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">

            {/* ICON */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <ClipboardList size={24} />
            </div>

            {/* CONTENT */}
            <div className="flex-1">

              <h3 className="font-semibold text-slate-800">
                Closer Workflow
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Process your assigned approved leads and submit
                the final outcome.
              </p>

              {/* WORKFLOW STATUS */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">

                {/* ASSIGNED */}
                <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                  Assigned
                </span>

                <span className="text-slate-400">
                  →
                </span>

                {/* PROCESS */}
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                  Process
                </span>

                <span className="text-slate-400">
                  →
                </span>

                {/* SOLD */}
                <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                  Sold
                </span>

                <span className="text-slate-400">
                  /
                </span>

                {/* CALLBACK */}
                <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-700">
                  Callback
                </span>

                <span className="text-slate-400">
                  /
                </span>

                {/* LOST */}
                <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
                  Lost
                </span>

              </div>

            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}