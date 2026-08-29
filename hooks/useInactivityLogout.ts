"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

// A mousemove can fire dozens of times a second — throttle how often we
// touch localStorage so idle-but-open tabs aren't churning writes.
const ACTIVITY_WRITE_THROTTLE_MS = 5 * 1000;

const CHECK_INTERVAL_MS = 30 * 1000;

const STORAGE_KEY = "fc_last_activity";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

// Silently signs the user out after INACTIVITY_LIMIT_MS with no mouse,
// keyboard, scroll, or touch activity. `lastActivity` is written to
// localStorage (not just kept in a ref) so activity in any open CRM tab
// resets the clock for every other open tab, not just the one the user is
// currently on.
export function useInactivityLogout(enabled: boolean) {
  const router = useRouter();
  // Set for real by the recordActivity() call at the top of the effect
  // below, before any listener or interval can read it — 0 here is just
  // an inert placeholder so we don't call Date.now() during render.
  const lastActivityRef = useRef(0);
  const lastWriteRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    function recordActivity() {
      const now = Date.now();
      lastActivityRef.current = now;

      if (now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;

      lastWriteRef.current = now;

      try {
        window.localStorage.setItem(STORAGE_KEY, String(now));
      } catch {
        // Storage disabled (private browsing, quota) — this tab still
        // tracks its own activity via the ref above.
      }
    }

    // Seed storage immediately so a freshly opened tab doesn't inherit a
    // stale timestamp left over from a previous, already-idle session.
    recordActivity();

    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, recordActivity, { passive: true })
    );

    const interval = window.setInterval(async () => {
      let lastActivity = lastActivityRef.current;

      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const storedTime = stored ? Number(stored) : NaN;

        if (Number.isFinite(storedTime) && storedTime > lastActivity) {
          lastActivity = storedTime;
        }
      } catch {
        // Fall back to this tab's own record.
      }

      if (Date.now() - lastActivity < INACTIVITY_LIMIT_MS) return;

      window.clearInterval(interval);

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (error) {
        console.error("Inactivity logout error:", error);
      }

      router.push("/login");
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, recordActivity)
      );

      window.clearInterval(interval);
    };
  }, [enabled, router]);
}
