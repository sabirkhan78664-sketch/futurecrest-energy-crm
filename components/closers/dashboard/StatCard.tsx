import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: StatCardProps) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <h2 className="mt-3 text-4xl font-bold text-slate-900">
            {value}
          </h2>
        </div>

        <div className={`rounded-xl p-3 ${iconBg}`}>
          <Icon className={`h-7 w-7 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}