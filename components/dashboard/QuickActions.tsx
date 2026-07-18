import Link from "next/link";
import {
  Plus,
  Users,
  FileText,
  Calendar,
} from "lucide-react";

const actions = [
  {
    title: "New Lead",
    href: "/leads/new",
    icon: Plus,
    color: "bg-blue-600",
  },
  {
    title: "Add Agent",
    href: "/agents/new",
    icon: Users,
    color: "bg-green-600",
  },
  {
    title: "Lead List",
    href: "/leads",
    icon: FileText,
    color: "bg-purple-600",
  },
  {
    title: "Follow-ups",
    href: "/followups",
    icon: Calendar,
    color: "bg-orange-600",
  },
];

export default function QuickActions() {
  return (
    <div className="rounded-xl border bg-white p-6 shadow">

      <h2 className="mb-5 text-xl font-bold">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-4">

        {actions.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-xl border p-4 transition hover:shadow-lg hover:-translate-y-1"
            >
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${item.color} text-white`}
              >
                <Icon size={22} />
              </div>

              <p className="font-semibold">
                {item.title}
              </p>
            </Link>
          );
        })}

      </div>

    </div>
  );
}