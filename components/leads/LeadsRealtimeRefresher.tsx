"use client";

import { useRouter } from "next/navigation";
import { useLeadsRealtime } from "@/lib/useLeadsRealtime";

// Drop this into any server-rendered leads page — it re-fetches that
// page's server data whenever the leads table changes, so a Closer
// marking a lead Sold shows up for everyone else without a manual reload.
export default function LeadsRealtimeRefresher() {
  const router = useRouter();

  useLeadsRealtime(() => router.refresh());

  return null;
}
