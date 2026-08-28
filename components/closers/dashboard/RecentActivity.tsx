import Link from "next/link";
import {
  UserPlus,
  CheckCircle,
  UserCheck,
  XCircle,
} from "lucide-react";

export type Activity = {
  id: number;
  activity_type:
    | "lead_created"
    | "lead_approved"
    | "lead_assigned"
    | "lead_rejected"
    | "sale_completed";
  description: string;
  created_at: string;
};

interface Props {
  activities: Activity[];
}

const icons = {
  lead_created: UserPlus,
  lead_approved: CheckCircle,
  lead_assigned: UserCheck,
  lead_rejected: XCircle,
  sale_completed: CheckCircle,
};

const colors = {
  lead_created: "text-blue-600",
  lead_approved: "text-green-600",
  lead_assigned: "text-purple-600",
  lead_rejected: "text-red-600",
  sale_completed: "text-emerald-600",
};

export default function RecentActivity({ activities }: Props) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Recent Activity
        </h2>

        <Link
          href="/activity"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-500">
            No recent activity.
          </p>
        ) : (
          activities.map((activity) => {
            const Icon =
              icons[activity.activity_type] ?? UserPlus;

            const color =
              colors[activity.activity_type] ??
              "text-blue-600";

            return (
              <div
                key={activity.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <Icon className={`h-6 w-6 ${color}`} />

                <div className="flex-1">
                  <p className="font-medium">
                    {activity.description}
                  </p>

                  <p className="text-sm text-gray-500">
                    {new Date(
                      activity.created_at
                    ).toLocaleString("en-AU", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}