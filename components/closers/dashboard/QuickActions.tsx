import Link from "next/link";
import {
  Plus,
  ClipboardCheck,
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  MessageSquare,
  FileText,
} from "lucide-react";

interface Props {
  role: string;
}

export default function QuickActions({ role }: Props) {
  const actions =
    role === "Super Admin" || role === "Admin"
      ? [
          {
            title: "New Lead",
            href: "/leads/new",
            icon: Plus,
            color: "bg-blue-600",
          },
          {
            title: "Pending",
            href: "/pending-approvals",
            icon: ClipboardCheck,
            color: "bg-amber-500",
          },
          {
            title: "Users",
            href: "/users",
            icon: Users,
            color: "bg-purple-600",
          },
          {
            title: "Agents",
            href: "/agents",
            icon: Users,
            color: "bg-cyan-600",
          },
          {
            title: "Closers",
            href: "/closers",
            icon: UserCheck,
            color: "bg-green-600",
          },
          {
            title: "Follow-ups",
            href: "/followups",
            icon: Calendar,
            color: "bg-orange-600",
          },
          {
            title: "Reports",
            href: "/reports",
            icon: BarChart3,
            color: "bg-indigo-600",
          },
          {
            title: "Messages",
            href: "/messages",
            icon: MessageSquare,
            color: "bg-slate-700",
          },
        ]
      : role === "Agent"
      ? [
          {
            title: "New Lead",
            href: "/leads/new",
            icon: Plus,
            color: "bg-blue-600",
          },
          {
            title: "My Leads",
            href: "/leads",
            icon: FileText,
            color: "bg-cyan-600",
          },
          {
            title: "Follow-ups",
            href: "/followups",
            icon: Calendar,
            color: "bg-orange-600",
          },
          {
            title: "Messages",
            href: "/messages",
            icon: MessageSquare,
            color: "bg-slate-700",
          },
        ]
      : [
          {
            title: "Assigned Sales",
            href: "/sales",
            icon: FileText,
            color: "bg-green-600",
          },
          {
            title: "Messages",
            href: "/messages",
            icon: MessageSquare,
            color: "bg-slate-700",
          },
        ];

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">Quick Actions</h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.title}
              href={action.href}
              className="flex flex-col items-center rounded-xl border p-4 transition hover:shadow-md hover:-translate-y-1"
            >
              <div className={`${action.color} rounded-full p-3 text-white`}>
                <Icon size={22} />
              </div>

              <span className="mt-3 text-sm font-medium">
                {action.title}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}