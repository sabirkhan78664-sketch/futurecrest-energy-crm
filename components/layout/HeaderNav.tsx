"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Bell,
  ChevronDown,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";

interface HeaderNavProps {
  profile: {
    id?: string;
    full_name: string;
    employee_id: string;
    role: string;
  };
}

export default function HeaderNav({
  profile,
}: HeaderNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [searchText, setSearchText] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [latestUnreadSenderId, setLatestUnreadSenderId] = useState<
    string | null
  >(null);

  const [qaNotificationCount, setQaNotificationCount] = useState(0);
  const [qaNotifications, setQaNotifications] = useState<
    Array<{
      id: number;
      title: string;
      message: string;
      type?: string;
      reference_id?: number | null;
      created_at?: string;
    }>
  >([]);

  const [loggingOut, setLoggingOut] = useState(false);

  /* ============================================================
     LOAD UNREAD MESSAGES
  ============================================================ */

  async function loadUnreadCount() {
    if (!profile?.id) {
      setUnreadMsgCount(0);
      setLatestUnreadSenderId(null);
      return;
    }

    // Fetching sender_id (not just a head-count) so a notification click
    // can open the actual conversation — most recent unread first, since
    // count:"exact" still reports the true total regardless of limit.
    const { data, count, error } = await supabase
      .from("crm_messages")
      .select("sender_id", {
        count: "exact",
      })
      .eq("receiver_id", profile.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error(
        "Unread message count error:",
        error
      );
      return;
    }

    setUnreadMsgCount(count ?? 0);
    setLatestUnreadSenderId(data?.[0]?.sender_id ?? null);
  }

  useEffect(() => {
    if (!profile?.id) return;

    loadUnreadCount();
  }, [profile?.id, pathname]);

  /* ============================================================
     UNREAD MESSAGE POLLING FALLBACK

     The realtime subscription below silently does nothing if the
     crm_messages table isn't added to Supabase's realtime
     publication (a project-level config step, not something this
     app controls) — the channel still reports "SUBSCRIBED" but no
     postgres_changes events ever arrive. Without this, a recipient
     who doesn't navigate to a new page never sees their unread
     badge update. Poll as a guaranteed fallback regardless of
     whether realtime is actually wired up.
  ============================================================ */

  useEffect(() => {
    if (!profile?.id) return;

    const timer = window.setInterval(() => {
      loadUnreadCount();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [profile?.id]);

  /* ============================================================
     MESSAGE REALTIME
  ============================================================ */

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(
        `header-message-counter-${profile.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crm_messages",
        },
        async (payload) => {
          const newMessage =
            payload.new as {
              receiver_id?: string;
            };

          if (
            newMessage.receiver_id ===
            profile.id
          ) {
            await loadUnreadCount();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "crm_messages",
        },
        async (payload) => {
          const updatedMessage =
            payload.new as {
              receiver_id?: string;
            };

          if (
            updatedMessage.receiver_id ===
            profile.id
          ) {
            await loadUnreadCount();
          }
        }
      )
      .subscribe((status) => {
        console.log(
          "Header message realtime:",
          status
        );
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  /* ============================================================
     POST-SALE QA NOTIFICATIONS
  ============================================================ */

  async function loadQaNotifications() {
    if (!profile?.id || profile.role !== "QA") {
      setQaNotificationCount(0);
      setQaNotifications([]);
      return;
    }

    const { data: storedNotifications, error } = await supabase
      .from("notifications")
      .select("id, title, message, type, reference_id, created_at")
      .eq("user_id", profile.id)
      .eq("is_read", false)
      .eq("type", "post_sale_qa")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("QA notification load warning:", error.message);
    }

    const stored = (storedNotifications || []) as any[];
    const knownLeadIds = new Set(
      stored.map((item) => String(item.reference_id || ""))
    );

    const { data: soldLeads } = await supabase
      .from("leads")
      .select("id, lead_id, customer_name, created_at")
      .eq("status", "Sold")
      .not("qa_status", "in", "(Approved,Rejected)")
      .order("created_at", { ascending: false })
      .limit(10);

    const fallback = (soldLeads || [])
      .filter((lead: any) => !knownLeadIds.has(String(lead.id)))
      .map((lead: any) => ({
        id: -Number(lead.id),
        title: "Sold Lead — QA Available",
        message: `${lead.lead_id || `Lead #${lead.id}`} is ready for optional Post-Sale QA audit.`,
        type: "post_sale_qa",
        reference_id: lead.id,
        created_at: lead.created_at,
      }));

    const combined = [...stored, ...fallback].slice(0, 10);
    setQaNotifications(combined);
    setQaNotificationCount(combined.length);
  }

  useEffect(() => {
    if (!profile?.id || profile.role !== "QA") return;

    void loadQaNotifications();

    const channel = supabase
      .channel(`qa-notifications-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        async (payload) => {
          const notification = payload.new as any;

          if (notification.type !== "post_sale_qa") return;

          setQaNotifications((previous) => [
            notification,
            ...previous.filter((item) => item.id !== notification.id),
          ].slice(0, 10));

          setQaNotificationCount((previous) => previous + 1);

          try {
            const audio = new Audio(
              "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
            );
            audio.volume = 1;
            await audio.play();
          } catch {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role]);

  async function openQaNotification(notification: {
    id: number;
    reference_id?: number | null;
  }) {
    setShowNotifications(false);

    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notification.id)
        .eq("user_id", profile.id);
    } catch {}

    setQaNotifications((previous) =>
      previous.filter((item) => item.id !== notification.id)
    );
    setQaNotificationCount((previous) => Math.max(0, previous - 1));

    if (notification.reference_id) {
      router.push(`/leads/${notification.reference_id}`);
    } else {
      router.push("/qa?filter=sold");
    }
  }

  /* ============================================================
     CLOSE DROPDOWNS
  ============================================================ */

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(
          target
        )
      ) {
        setShowProfileMenu(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          target
        )
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /* ============================================================
     SEARCH
  ============================================================ */

  function handleSearchSubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  let query = searchText.trim();

  if (!query) return;

  /*
   * Remove common search labels.
   *
   * Example:
   * "Lead ID: fcslid00003"
   * becomes:
   * "fcslid00003"
   */

  query = query
    .replace(/^lead\s*id\s*:\s*/i, "")
    .replace(/^lead\s*:\s*/i, "")
    .trim();

  if (!query) return;

  router.push(
    `/leads?search=${encodeURIComponent(query)}`
  );
}

  /* ============================================================
     OPEN MESSAGES
  ============================================================ */

  function openMessages() {
    setShowNotifications(false);
    setShowProfileMenu(false);

    router.push(
      latestUnreadSenderId
        ? `/messages?user=${latestUnreadSenderId}`
        : "/messages"
    );
  }

  /* ============================================================
     LOGOUT
  ============================================================ */

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    setShowProfileMenu(false);
    setShowNotifications(false);

    try {
      await supabase.auth.signOut({
        scope: "local",
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      window.location.replace(
        "/login"
      );
    }
  }

  /* ============================================================
     PROFILE INITIAL
  ============================================================ */

  const initial = profile?.full_name
    ? profile.full_name
        .charAt(0)
        .toUpperCase()
    : "U";

  const totalNotifications =
    unreadMsgCount +
    qaNotificationCount;

  /* ============================================================
     UI
  ============================================================ */

  return (
    <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm">

      {/* SEARCH */}

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-1 items-center"
      >
        <div className="relative w-full max-w-[560px]">

          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            placeholder="Search leads, agents..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />

          {searchText && (
            <button
              type="button"
              onClick={() =>
                setSearchText("")
              }
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200"
            >
              <X size={15} />
            </button>
          )}

        </div>
      </form>

      {/* RIGHT SIDE */}

      <div className="flex items-center gap-3">

        {/* NOTIFICATIONS */}

        <div
          ref={notificationRef}
          className="relative"
        >

          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              setShowNotifications(
                (previous) =>
                  !previous
              );

              setShowProfileMenu(
                false
              );
            }}
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
          >

            <Bell size={21} />

            {totalNotifications >
              0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow">
                {totalNotifications >
                99
                  ? "99+"
                  : totalNotifications}
              </span>
            )}

          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 z-[100] w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                <p className="text-sm font-bold text-slate-800">
                  Notifications
                </p>

                {totalNotifications >
                  0 && (
                  <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
                    {totalNotifications}{" "}
                    new
                  </span>
                )}

              </div>

              {/* MESSAGES */}

              {unreadMsgCount >
                0 && (
                <button
                  type="button"
                  onClick={
                    openMessages
                  }
                  className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left hover:bg-slate-50"
                >

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <MessageSquare size={18} />
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-slate-800">
                      New messages
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      You have{" "}
                      {
                        unreadMsgCount
                      }{" "}
                      unread message
                      {unreadMsgCount !==
                      1
                        ? "s"
                        : ""}.
                    </p>

                    <p className="mt-2 text-xs font-semibold text-blue-600">
                      Open messages →
                    </p>

                  </div>

                </button>
              )}

              {/* POST-SALE QA */}

              {profile.role === "QA" &&
                qaNotifications.length > 0 &&
                qaNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() =>
                      openQaNotification(notification)
                    }
                    className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-4 text-left hover:bg-orange-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                      <Bell size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-blue-600">
                        Open Sold Lead →
                      </p>
                    </div>
                  </button>
                ))}

              {/* EMPTY */}

              {unreadMsgCount ===
                0 &&
                qaNotificationCount ===
                  0 && (
                  <div className="px-4 py-8 text-center">

                    <Bell
                      size={28}
                      className="mx-auto mb-2 text-slate-300"
                    />

                    <p className="text-sm font-medium text-slate-600">
                      No new notifications
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      You're all caught up.
                    </p>

                  </div>
                )}

            </div>
          )}

        </div>

        {/* MESSAGES */}

        <button
          type="button"
          onClick={openMessages}
          aria-label="Messages"
          className="relative flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:bg-blue-50"
        >

          <MessageSquare
            size={21}
            className="text-blue-600"
          />

          {unreadMsgCount >
            0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow">
              {unreadMsgCount >
              99
                ? "99+"
                : unreadMsgCount}
            </span>
          )}

        </button>

        {/* PROFILE */}

        <div
          ref={profileMenuRef}
          className="relative ml-1 border-l border-slate-200 pl-4"
        >

          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(
                (previous) =>
                  !previous
              );

              setShowNotifications(
                false
              );
            }}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
          >

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow">
              {initial}
            </div>

            <div className="hidden text-left md:block">

              <p className="max-w-[160px] truncate text-sm font-semibold leading-tight text-slate-900">
                {profile?.full_name}
              </p>

              <p className="font-mono text-[11px] text-slate-500">
                {profile?.employee_id}
              </p>

            </div>

            <ChevronDown
              size={16}
              className={`hidden text-slate-400 transition md:block ${
                showProfileMenu
                  ? "rotate-180"
                  : ""
              }`}
            />

          </button>

          {/* PROFILE DROPDOWN */}

          {showProfileMenu && (
            <div className="absolute right-0 top-14 z-[100] w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

              {/* USER */}

              <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                    {initial}
                  </div>

                  <div className="min-w-0">

                    <p className="truncate text-sm font-bold text-slate-900">
                      {profile?.full_name}
                    </p>

                    <p className="truncate font-mono text-[11px] text-slate-500">
                      {profile?.employee_id}
                    </p>

                    <p className="mt-1 text-xs font-medium text-blue-600">
                      {profile?.role}
                    </p>

                  </div>

                </div>

              </div>

              {/* MY PROFILE */}

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);

                  // IMPORTANT:
                  // Every logged-in user uses
                  // the same /profile page.
                  router.push(
                    "/profile"
                  );
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >

                <User size={17} />

                <span>
                  My Profile
                </span>

              </button>

              {/* SETTINGS */}

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);

                  router.push(
                    "/settings"
                  );
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >

                <Settings size={17} />

                <span>
                  Settings
                </span>

              </button>

              {/* LOGOUT */}

              <div className="border-t border-slate-100 p-2">

                <button
                  type="button"
                  disabled={
                    loggingOut
                  }
                  onClick={
                    handleLogout
                  }
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <LogOut
                    size={17}
                  />

                  <span>
                    {loggingOut
                      ? "Logging out..."
                      : "Logout"}
                  </span>

                </button>

              </div>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}   