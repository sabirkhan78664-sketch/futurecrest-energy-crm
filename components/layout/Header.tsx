"use client";

import { Bell, Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const router = useRouter();

  async function logout() {
    const confirmLogout = confirm("Are you sure you want to logout?");

    if (!confirmLogout) return;

    await supabase.auth.signOut();

    router.push("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-2xl font-bold text-slate-800">
        Dashboard
      </h1>

      <div className="flex items-center gap-4">

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

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
            S
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