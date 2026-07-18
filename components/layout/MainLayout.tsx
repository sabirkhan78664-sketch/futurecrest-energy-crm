"use client";

import { ReactNode, useEffect, useState } from "react";
import { getCurrentProfile } from "@/lib/profile";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({
  children,
}: MainLayoutProps) {
  const [role, setRole] = useState("Admin");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function loadProfile() {
    const profile = await getCurrentProfile();

    console.log("PROFILE FROM MainLayout:", profile);

    if (profile) {
      console.log("ROLE:", profile.role);
      setRole(profile.role);
    }

    setLoading(false);
  }

  loadProfile();
}, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">

      <Sidebar role={role} />

      <div className="flex flex-1 flex-col overflow-hidden">

        <Header />

        <main className="flex-1 overflow-y-auto p-3">
          {children}
        </main>

      </div>

    </div>
  );
}