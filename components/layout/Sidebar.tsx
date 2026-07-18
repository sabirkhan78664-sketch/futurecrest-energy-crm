"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  Shield,
  Calendar,
  MessageSquare,
} from "lucide-react";

interface SidebarProps {
  role?: string;
}

export default function Sidebar({
  role = "Admin",
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems =
  role === "Admin"
    ? [
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
          name: "Users",
          href: "/users",
          icon: Shield,
        },
        {
          name: "Agents",
          href: "/agents",
          icon: Users,
        },
        {
          name: "Closers",
          href: "/closers",
          icon: UserCheck,
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
},
        {
          name: "Settings",
          href: "/settings",
          icon: Settings,
        },
      ]
    : role === "Agent"
    ? [
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
},
      ]
    : role === "Closer"
    ? [
  {
    name: "Dashboard",
    href: "/closer",
    icon: LayoutDashboard,
  },
  {
    name: "Assigned Sales",
    href: "/sales",
    icon: FileText,
  },
  {
    name: "Messages",
    href: "/messages",
    icon: MessageSquare,
  },
]
    : role === "Supervisor"
    ? [
        {
          name: "Dashboard",
          href: "/supervisor",
          icon: LayoutDashboard,
        },
        {
          name: "Team",
          href: "/team",
          icon: Users,
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
},
{
  name: "Settings",
  href: "/settings",
  icon: Settings,
},
      ]
    : [
        {
          name: "Dashboard",
          href: "/client",
          icon: LayoutDashboard,
        },
      ];

  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900 text-white">

      {/* Logo */}
      <div className="border-b border-slate-800 p-6 text-center">
        <h1 className="text-2xl font-bold">
          FutureCrest
        </h1>
        <p className="text-xs text-slate-400">
          ENERGY CRM
        </p>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${
                pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4 text-center">
        <p className="text-xs text-slate-500">
          FutureCrest CRM v1.0
        </p>
      </div>

    </aside>
  );
}