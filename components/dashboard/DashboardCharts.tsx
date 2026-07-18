"use client";

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", leads: 12 },
  { day: "Tue", leads: 18 },
  { day: "Wed", leads: 8 },
  { day: "Thu", leads: 22 },
  { day: "Fri", leads: 14 },
  { day: "Sat", leads: 16 },
];

export default function DashboardCharts() {
  return (
    <div className="rounded-xl border bg-white p-4 shadow">

      <h2 className="mb-6 text-lg font-bold">
        Weekly Leads
      </h2>

      <ResponsiveContainer
        width="100%"
        height={180}
      >

        <LineChart data={data}>

          <XAxis dataKey="day" />

          <Tooltip />

          <Line
            dataKey="leads"
            stroke="#2563eb"
            strokeWidth={4}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}