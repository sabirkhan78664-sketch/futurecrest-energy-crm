import { redirect } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get CRM profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  const initial = profile.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : "U";

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            My Profile
          </h1>

          <p className="mt-1 text-slate-500">
            View your FutureCrest CRM account information.
          </p>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-8">
            <div className="flex items-center gap-5">

              {/* Avatar */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-bold text-blue-600 shadow-lg">
                {initial}
              </div>

              {/* Name */}
              <div className="text-white">
                <h2 className="text-2xl font-bold">
                  {profile.full_name || "User"}
                </h2>

                <p className="mt-1 text-blue-100">
                  {profile.role || "User"}
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-sm text-blue-100">
                    Active Account
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="p-6">

            <h3 className="mb-5 text-lg font-bold text-slate-900">
              Account Information
            </h3>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* Full Name */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Full Name
                </p>

                <p className="mt-2 text-base font-semibold text-slate-900">
                  {profile.full_name || "Not available"}
                </p>
              </div>

              {/* Employee ID */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Employee ID
                </p>

                <p className="mt-2 font-mono text-base font-semibold text-slate-900">
                  {profile.employee_id || "Not available"}
                </p>
              </div>

              {/* Role */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Role
                </p>

                <p className="mt-2 text-base font-semibold text-blue-600">
                  {profile.role || "User"}
                </p>
              </div>

              {/* Username */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Username
                </p>

                <p className="mt-2 text-base font-semibold text-slate-900">
                  {profile.username || "Not available"}
                </p>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email
                </p>

                <p className="mt-2 break-all text-base font-semibold text-slate-900">
                  {user.email || "Not available"}
                </p>
              </div>

              {/* User ID */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Account ID
                </p>

                <p className="mt-2 break-all font-mono text-xs text-slate-600">
                  {profile.id}
                </p>
              </div>

            </div>

            {/* Security Notice */}
            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                🔐 Account Security
              </p>

              <p className="mt-1 text-sm text-blue-700">
                Your account access and permissions are controlled by your
                FutureCrest CRM role.
              </p>
            </div>

          </div>
        </div>

        {/* Back Button */}
        <div>
          <a
            href="/dashboard"
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ← Back to Dashboard
          </a>
        </div>

      </div>
    </MainLayout>
  );
}