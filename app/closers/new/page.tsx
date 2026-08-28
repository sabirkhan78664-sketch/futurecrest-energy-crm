import MainLayout from "@/components/layout/MainLayout";
import { getCurrentUserProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, MessageSquare, CheckCircle } from "lucide-react";

export default async function CloserDashboard() {
  const profile = await getCurrentUserProfile();

  if (!profile || profile.role !== "Closer") {
    redirect("/login");
  }

  return (
    <MainLayout>
      <div className="space-y-6 p-2">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold">Welcome back, {profile.full_name}! 🚀</h1>
          <p className="mt-2 text-emerald-100">Ready to finalize some sales today?</p>
        </div>

        <h2 className="mt-8 mb-4 text-xl font-bold text-slate-800">Quick Actions</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/sales" className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:border-emerald-500 hover:shadow-md">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Assigned Sales</h3>
            <p className="mt-2 text-sm text-slate-500">View deals ready for you to close.</p>
          </Link>

          <Link href="/messages" className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm transition hover:border-blue-500 hover:shadow-md">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Messages</h3>
            <p className="mt-2 text-sm text-slate-500">Communicate with agents and admins.</p>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}