import {
  CheckCircle,
  Phone,
  UserPlus,
} from "lucide-react";

const activities = [
  {
    icon: UserPlus,
    text: "New Lead Created",
  },
  {
    icon: Phone,
    text: "Callback Scheduled",
  },
  {
    icon: CheckCircle,
    text: "Sale Completed",
  },
];

export default function RecentActivity() {
  return (
    <div className="rounded-xl border bg-white p-6 shadow">

      <h2 className="mb-6 text-xl font-bold">
        Recent Activity
      </h2>

      <div className="space-y-4">

        {activities.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.text}
              className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"
            >
              <Icon
                size={20}
                className="text-blue-600"
              />

              <span>{item.text}</span>

            </div>
          );
        })}

      </div>

    </div>
  );
}