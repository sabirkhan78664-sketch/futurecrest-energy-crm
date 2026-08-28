"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  sales: "Sales",
  reports: "Reports",
  qa: "QA",
  messages: "Messages",
  admin: "Admin",
  users: "Users",
  settings: "Settings",
  import: "Import / Update",
  agent: "Agent",
  closer: "Closer",
};

function prettyLabel(segment: string) {
  if (labels[segment]) return labels[segment];
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PageNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter(Boolean);

  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <nav className="flex min-w-0 items-center gap-1 text-sm" aria-label="Breadcrumb">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-blue-600"
        >
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Link>

        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;

          return (
            <span key={`${segment}-${index}`} className="flex min-w-0 items-center gap-1">
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
              {isLast ? (
                <span className="truncate rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-800">
                  {prettyLabel(segment)}
                </span>
              ) : (
                <Link
                  href={href}
                  className="truncate rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                >
                  {prettyLabel(segment)}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
    </div>
  );
}
