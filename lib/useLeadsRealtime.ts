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
    // Trailing debounce: a burst of changes (an import, a bulk assign)
    // fires one event per row, and each used to trigger its own full
    // server re-render / API call on every open screen. Collapse a burst
    // into a single refresh ~1s after the last change.
    let timer: ReturnType<typeof setTimeout> | null = null;

    const channel = supabase
      .channel(`leads-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          if (timer) clearTimeout(timer);

          timer = setTimeout(() => {
            timer = null;
            onChangeRef.current();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);

      supabase.removeChannel(channel);
    };
  }, []);
}
