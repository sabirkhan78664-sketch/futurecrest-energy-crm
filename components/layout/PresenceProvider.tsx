"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

interface PresenceContextValue {
  onlineUserIds: Set<string>;
}

const PresenceContext =
  createContext<PresenceContextValue | null>(null);

interface PresenceProviderProps {
  userId?: string | null;
  children: ReactNode;
}

export default function PresenceProvider({
  userId,
  children,
}: PresenceProviderProps) {
  const [onlineUserIds, setOnlineUserIds] =
    useState<Set<string>>(new Set());

  const channelRef = useRef<ReturnType<
    typeof supabase.channel
  > | null>(null);

  const retryTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    if (!userId) {
      setOnlineUserIds(new Set());

      return () => {
        mountedRef.current = false;
      };
    }

    let stopped = false;
    let retryCount = 0;

    console.log(
      "🟢 Starting global CRM presence:",
      userId
    );

    const cleanupChannel = async () => {
      const channel = channelRef.current;

      if (!channel) return;

      channelRef.current = null;

      try {
        await channel.untrack();
      } catch {
        // Ignore cleanup errors.
      }

      try {
        await supabase.removeChannel(channel);
      } catch {
        // Ignore cleanup errors.
      }
    };

    const updateOnlineUsers = (
      channel: ReturnType<typeof supabase.channel>
    ) => {
      if (stopped || !mountedRef.current) return;

      const state = channel.presenceState();

      const ids = new Set<string>(
        Object.keys(state)
      );

      setOnlineUserIds(ids);

      console.log(
        "🟢 CRM ONLINE USERS:",
        Array.from(ids)
      );
    };

    const scheduleRetry = () => {
      if (stopped) return;

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }

      retryCount++;

      const delay = Math.min(
        30000,
        2000 * retryCount
      );

      console.log(
        `🔄 Presence reconnect scheduled in ${delay}ms`
      );

      retryTimerRef.current = setTimeout(() => {
        if (!stopped) {
          startPresence();
        }
      }, delay);
    };

    const startPresence = async () => {
      if (stopped) return;

      await cleanupChannel();

      if (stopped) return;

      console.log(
        "🔌 Connecting CRM presence..."
      );

      const channel = supabase.channel(
        "crm-online-users",
        {
          config: {
            presence: {
              key: userId,
            },
          },
        }
      );

      channelRef.current = channel;

      channel.on(
        "presence",
        { event: "sync" },
        () => {
          console.log(
            "🔄 GLOBAL PRESENCE SYNC"
          );

          updateOnlineUsers(channel);
        }
      );

      channel.on(
        "presence",
        { event: "join" },
        ({ key }) => {
          console.log(
            "👤 USER JOINED:",
            key
          );

          updateOnlineUsers(channel);
        }
      );

      channel.on(
        "presence",
        { event: "leave" },
        ({ key }) => {
          console.log(
            "👋 USER LEFT:",
            key
          );

          updateOnlineUsers(channel);
        }
      );

      channel.subscribe(async (status, error) => {
        if (stopped) return;

        console.log(
          "👥 GLOBAL PRESENCE STATUS:",
          status,
          error ?? ""
        );

        if (status === "SUBSCRIBED") {
          retryCount = 0;

          try {
            const result = await channel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });

            if (stopped) return;

            console.log(
              "✅ GLOBAL PRESENCE TRACKED:",
              result
            );

            updateOnlineUsers(channel);
          } catch (err) {
            console.warn(
              "⚠️ Presence tracking failed. Retrying...",
              err
            );

            scheduleRetry();
          }

          return;
        }

        if (status === "CHANNEL_ERROR") {
          console.warn(
            "⚠️ GLOBAL PRESENCE CHANNEL ERROR:",
            error ?? "Unknown channel error"
          );

          scheduleRetry();

          return;
        }

        if (status === "TIMED_OUT") {
          console.warn(
            "⏱️ GLOBAL PRESENCE TIMEOUT. Retrying..."
          );

          scheduleRetry();

          return;
        }

        if (status === "CLOSED") {
          if (!stopped) {
            console.log(
              "🔴 GLOBAL PRESENCE CHANNEL CLOSED"
            );
          }

          return;
        }
      });
    };

    startPresence();

    return () => {
      stopped = true;
      mountedRef.current = false;

      console.log(
        "🔴 Removing global presence:",
        userId
      );

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      cleanupChannel();

      setOnlineUserIds(new Set());
    };
  }, [userId]);

  const value = useMemo(
    () => ({
      onlineUserIds,
    }),
    [onlineUserIds]
  );

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);

  if (!context) {
    return {
      onlineUserIds: new Set<string>(),
    };
  }

  return context;
}