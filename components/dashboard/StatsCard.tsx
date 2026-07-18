"use client";

import Link from "next/link";

interface Props {
  title: string;
  value: number | string;
  color?: string;
  href?: string;
}

export default function StatsCard({
  title,
  value,
  color = "text-blue-600",
  href,
}: Props) {
  const card = (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md cursor-pointer">

      <p className="text-xs text-slate-500">
        {title}
      </p>

      <h2 className={`mt-3 text-2xl font-bold ${color}`}>
        {value}
      </h2>

    </div>
  );

  if (href) {
    return <Link href={href}>{card}</Link>;
  }

  return card;
}