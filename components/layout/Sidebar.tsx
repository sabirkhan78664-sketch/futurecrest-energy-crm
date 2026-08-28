"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  Upload,
  Settings,
  Shield,
  Calendar,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

type MenuItem = {
  name: string;
  href: string;
  icon: any;
  badge?: number;
  group?: string;
};

interface SidebarProps {
  profile: {
    id?: string;
    role: string;
    full_name: string;
    employee_id: string;
  };

  stats: {
    pendingApproval: number;
    unreadMessages: number;
    followUpsToday: number;
    qaPending?: number;
  };
}

export default function Sidebar({
  profile,
  stats,
}: SidebarProps) {
  const pathname = usePathname();
  const role = profile.role;

  const [unreadCount, setUnreadCount] =
    useState(stats.unreadMessages || 0);

  /* ============================================================
     LOAD UNREAD MESSAGES
  ============================================================ */

  async function loadUnreadCount() {
    if (!profile.id) return;

    const { count, error } = await supabase
      .from("crm_messages")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("receiver_id", profile.id)
      .eq("is_read", false);

    if (error) {
      console.error(
        "Sidebar unread message count error:",
        error
      );
      return;
    }

    setUnreadCount(count ?? 0);
  }

  /* ============================================================
     LOAD MESSAGE COUNT
  ============================================================ */

  useEffect(() => {
    if (!profile.id) return;

    loadUnreadCount();
  }, [profile.id, pathname]);

  /* ============================================================
     REALTIME MESSAGE COUNT
  ============================================================ */

  useEffect(() => {
    if (!profile.id) return;

    const channel = supabase
      .channel(
        `sidebar-message-sync-${profile.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crm_messages",
        },
        async (payload) => {
          const message =
            payload.new as any;

          if (
            message.receiver_id ===
            profile.id
          ) {
            await loadUnreadCount();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "crm_messages",
        },
        async (payload) => {
          const message =
            payload.new as any;

          if (
            message.receiver_id ===
            profile.id
          ) {
            await loadUnreadCount();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  /* ============================================================
     MENU
  ============================================================ */

  let menuItems: MenuItem[] = [];

  /* ============================================================
     SUPER ADMIN / ADMIN
  ============================================================ */

  if (
    role === "Super Admin" ||
    role === "Admin"
  ) {
    menuItems = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },

      {
        name: "Leads",
        href: "/leads",
        icon: FileText,
      },

      {
        name: "Pending Approvals",
        href: "/pending-approvals",
        icon: Shield,
        badge: stats.pendingApproval,
        group: "Approvals & QA",
      },

      {
        name: "QA Queue",
        href: "/qa",
        icon: ShieldCheck,
        badge: stats.qaPending,
        group: "Approvals & QA",
      },

      {
        name: "Users",
        href: "/users",
        icon: Users,
        group: "Team",
      },

      {
        name: "Agents",
        href: "/agents",
        icon: Users,
        group: "Team",
      },

      {
        name: "Closers",
        href: "/closers",
        icon: UserCheck,
        group: "Team",
      },

      {
        name: "Follow-ups",
        href: "/followups",
        icon: Calendar,
      },

      {
        name: "Reports",
        href: "/reports",
        icon: BarChart3,
      },

      {
        name: "Messages",
        href: "/messages",
        icon: MessageSquare,
        badge: unreadCount,
      },
    ];
  }

  /* ============================================================
     AGENT
  ============================================================ */

  else if (role === "Agent") {
    menuItems = [
      {
        name: "Dashboard",
        href: "/agent",
        icon: LayoutDashboard,
      },

      {
        name: "My Leads",
        href: "/leads",
        icon: FileText,
      },

      {
        name: "Follow-ups",
        href: "/followups",
        icon: Calendar,
      },

      {
        name: "Messages",
        href: "/messages",
        icon: MessageSquare,
        badge: unreadCount,
      },
    ];
  }

  /* ============================================================
     CHANNEL PARTNER
  ============================================================ */

  else if (role === "Channel Partner") {
    menuItems = [
      {
        name: "Dashboard",
        href: "/agent",
        icon: LayoutDashboard,
      },

      {
        name: "My Leads",
        href: "/leads",
        icon: FileText,
      },
    ];
  }

  /* ============================================================
     CLOSER
  ============================================================ */

  else if (role === "Closer") {
    menuItems = [
      {
        name: "Dashboard",
        href: "/closer",
        icon: LayoutDashboard,
      },

      {
  name: "Leads",
  href: "/sales",
  icon: FileText,
},

      {
        name: "Messages",
        href: "/messages",
        icon: MessageSquare,
        badge: unreadCount,
      },
    ];
  }

  /* ============================================================
     QA
     
     TEAM REMOVED BECAUSE /team DOES NOT EXIST.
  ============================================================ */

  else if (role === "QA") {
    menuItems = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },

      {
        name: "QA Queue",
        href: "/qa",
        icon: ShieldCheck,
        badge: stats.qaPending,
      },

      {
        name: "Reports",
        href: "/reports",
        icon: BarChart3,
      },

      {
        name: "Messages",
        href: "/messages",
        icon: MessageSquare,
        badge: unreadCount,
      },
    ];
  }

  /* ============================================================
     FALLBACK
  ============================================================ */

  else {
    menuItems = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ];
  }

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <aside className="flex h-screen w-[300px] flex-col bg-[#0b1328] text-white">

      {/* ======================================================
          LOGO
      ====================================================== */}

      <div className="border-b border-slate-800 bg-[#080f20] px-3 py-3">

        <Link
          href="/dashboard"
          className="block"
        >
          <div className="flex h-[68px] items-center justify-center overflow-hidden rounded-lg bg-white px-2 shadow-sm">

            <Image
              src="/logo.jpg"
              alt="FutureCrest Solutions Pvt Ltd"
              width={240}
              height={70}
              priority
              className="max-h-[62px] w-auto object-contain"
            />

          </div>
        </Link>

      </div>

      {/* ======================================================
          USER PROFILE
      ====================================================== */}

      <div className="border-b border-slate-800 px-5 py-5">

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white shadow">

            {profile.full_name
              ? profile.full_name
                  .charAt(0)
                  .toUpperCase()
              : "U"}

          </div>

          <div className="min-w-0">

            <p className="truncate text-sm font-semibold text-white">
              {profile.full_name}
            </p>

            <p className="text-sm text-slate-400">
              {profile.role}
            </p>

            <div className="mt-1 flex items-center gap-1.5">

              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-400">
                Online
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">

        {menuItems.map(
          (item, index) => {
            const Icon =
              item.icon;

            const isActive =
              pathname ===
                item.href ||
              pathname.startsWith(
                `${item.href}/`
              );

            const previousGroup =
              index > 0
                ? menuItems[index - 1].group
                : undefined;

            const showGroupLabel =
              !!item.group &&
              item.group !== previousGroup;

            return (
              <div key={item.href}>

                {showGroupLabel && (
                  <p
                    className={`mb-1.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 ${
                      index === 0 ? "mt-0" : "mt-4"
                    }`}
                  >
                    {item.group}
                  </p>
                )}

                <Link
                  href={item.href}
                  className={`flex items-center rounded-lg px-4 py-3 text-sm transition ${
                    isActive
                      ? "bg-blue-600 font-medium text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >

                  <div className="flex w-full items-center justify-between">

                    <div className="flex items-center gap-3">

                      <Icon size={18} />

                      <span>
                        {item.name}
                      </span>

                    </div>

                    {item.badge !==
                      undefined &&
                      item.badge > 0 && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold text-white ${
                            item.name ===
                            "Messages"
                              ? "bg-red-600"
                              : "bg-orange-500"
                          }`}
                        >
                          {item.badge >
                          99
                            ? "99+"
                            : item.badge}
                        </span>
                      )}

                  </div>

                </Link>

              </div>
            );
          }
        )}

        {(role === "Super Admin" || role === "Admin") && (
          <>
            <hr className="my-3 border-slate-800" />

            <Link
              href="/leads/import"
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-xs text-slate-500 transition hover:text-slate-300"
            >
              <Upload size={14} />
              Import Leads
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-4 py-2 text-xs text-slate-500 transition hover:text-slate-300"
            >
              <Settings size={14} />
              Settings
            </Link>
          </>
        )}

      </nav>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div className="border-t border-slate-800 p-4 text-center">

        <p className="text-xs text-slate-500">
          FutureCrest CRM v1.0
        </p>

        <p className="mt-1 text-[10px] text-slate-600">
          FutureCrest Solutions Pvt Ltd
        </p>

      </div>

    </aside>
  );
}