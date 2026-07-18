"use client";

interface Props {
  count: number;
}

export default function UnreadBadge({
  count,
}: Props) {
  if (count === 0) return null;

  return (
    <span className="ml-2 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white">
      {count}
    </span>
  );
}