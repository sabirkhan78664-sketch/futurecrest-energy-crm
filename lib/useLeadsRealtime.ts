"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

// Subscribes to any INSERT/UPDATE/DELETE on the leads table and invokes
// onChange — e.g. a Closer marking a lead Sold should be reflected on
// every other open screen without that user hitting refresh.
export function useLeadsRealtime(onChange: () => void) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const channel = supabase
      .channel(`leads-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => onChangeRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
