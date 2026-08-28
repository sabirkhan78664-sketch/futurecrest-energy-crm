"use client";

import { LogOut, Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  profile: {
    id: string;
    employee_id: string;
    full_name: string;
    role: string;
  };
}

export default function Header({ profile }: HeaderProps) {
  const router = useRouter();

  async function logout() {
  if (!confirm("Are you sure you want to logout?")) return;

  try {
    // Sign out from Supabase browser client
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Clear server cookies
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    // Force a full page reload
    window.location.replace("/login");
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Logout failed.");
  }
}

  const initials =
    profile.full_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Dashboard
        </h1>

        <p className="text-sm text-slate-500">
          Welcome {profile.full_name}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center rounded-lg border px-3 py-2">
          <Search size={18} />

          <input
            className="ml-2 outline-none"
            placeholder="Search..."
          />
        </div>

        <button className="rounded-lg p-2 hover:bg-slate-100">
          <Bell size={20} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
            {initials}
          </div>

          <div className="hidden md:block">
            <div className="font-semibold">
              {profile.full_name}
            </div>

            <div className="text-xs text-slate-500">
              {profile.employee_id}
            </div>

            <div className="mt-1 inline-block rounded bg-blue-100 px-2 py-1 text-xs">
              {profile.role}
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}