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

  const profileMenuRef =
    useRef<HTMLDivElement>(null);

  const notificationRef =
    useRef<HTMLDivElement>(null);

  const [searchText, setSearchText] =
    useState("");

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [unreadMsgCount, setUnreadMsgCount] =
    useState(0);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [duplicateResults, setDuplicateResults] =
    useState<any[]>([]);

  const [showDuplicateResults, setShowDuplicateResults] =
    useState(false);

  const [duplicateSearching, setDuplicateSearching] =
    useState(false);

  /*
   * ============================================================
   * UNREAD MESSAGE COUNT
   * ============================================================
   */

  async function loadUnreadCount() {
    if (!profile?.id) {
      setUnreadMsgCount(0);
      return;
    }

    const { count, error } = await supabase
      .from("crm_messages")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("receiver_id", profile.id)
      .eq("is_read", false);

    if (error) {
      console.error(
        "Unread message count error:",
        error
      );
      return;
    }

    setUnreadMsgCount(count ?? 0);
  }

  /*
   * ============================================================
   * LOAD COUNT
   * ============================================================
   */

  useEffect(() => {
    if (!profile?.id) return;

    loadUnreadCount();
  }, [profile?.id, pathname]);

  /*
   * ============================================================
   * REALTIME MESSAGE COUNT
   * ============================================================
   */

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  /*
   * ============================================================
   * CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
   * ============================================================
   */

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

  /*
   * ============================================================
   * SEARCH
   * ============================================================
   */

  async function handleSearchSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const query = searchText.trim();

    if (!query) {
      return;
    }

    // Mobile/NMI searches use the GLOBAL ENERGY DUPLICATE CHECK.
    // This checks all Energy leads, not only the user's permitted leads.
    const compact = query.replace(/[^A-Za-z0-9+]/g, "");
    const digits = query.replace(/\D/g, "");
    const looksLikeMobile =
      digits.length >= 9 && digits.length <= 13;
    const looksLikeNmi =
      /^[A-Za-z0-9]{8,14}$/.test(compact) &&
      (/[A-Za-z]/.test(compact) || digits.length >= 10);

    if (looksLikeMobile || looksLikeNmi) {
      setDuplicateSearching(true);
      setShowDuplicateResults(false);

      try {
        const response = await fetch(
          `/api/leads/duplicate-check?q=${encodeURIComponent(query)}`
        );

        const json = await response.json().catch(() => ({}));

        if (response.ok) {
          setDuplicateResults(json.leads || []);
          setShowDuplicateResults(true);
          return;
        }

        console.error(
          "Global duplicate check failed:",
          json.message
        );
      } catch (error) {
        console.error(
          "Global duplicate check error:",
          error
        );
      } finally {
        setDuplicateSearching(false);
      }

      return;
    }

    router.push(
      `/leads?search=${encodeURIComponent(query)}`
    );
  }

  /*
   * ============================================================
   * OPEN MESSAGES
   * ============================================================
   */

  function openMessages() {
    setShowNotifications(false);
    setShowProfileMenu(false);

    router.push("/messages");
  }

  /*
   * ============================================================
   * LOGOUT
   *
   * IMPORTANT:
   * We always redirect in finally.
   * This prevents the UI from remaining on
   * "Logging out..." if Supabase takes too long.
   * ============================================================
   */

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

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
      /*
       * Force navigation to login.
       *
       * This ensures the user can immediately
       * log in with another CRM account.
       */

      window.location.replace("/login");
    }
  }

  /*
   * ============================================================
   * PROFILE INITIAL
   * ============================================================
   */

  const initial =
    profile?.full_name
      ? profile.full_name
          .charAt(0)
          .toUpperCase()
      : "U";

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm">

      {/* ======================================================
          SEARCH BAR
      ====================================================== */}

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
            placeholder="Search leads, agents, mobile or NMI..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />

          {searchText && (
            <button
              type="button"
              onClick={() =>
                setSearchText("")
              }
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <X size={15} />
            </button>
          )}

        </div>
      </form>

      {duplicateSearching && (
        <div className="fixed left-1/2 top-20 z-[100] -translate-x-1/2 rounded-xl border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xl">
          Checking all Energy leads for duplicate...
        </div>
      )}

      {showDuplicateResults && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-slate-900/40 px-4 pt-28">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Energy Duplicate Check
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Mobile / NMI: {searchText.trim()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDuplicateResults(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              {duplicateResults.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <div className="text-base font-bold text-emerald-700">
                    No duplicate found
                  </div>
                  <div className="mt-1 text-sm text-emerald-600">
                    This mobile/NMI does not exist in the Energy campaign.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <div className="font-bold text-red-700">
                      {duplicateResults.length} duplicate lead{duplicateResults.length === 1 ? "" : "s"} found
                    </div>
                    <div className="mt-1 text-xs text-red-600">
                      Check the existing lead before creating a new Energy lead.
                    </div>
                  </div>

                  {duplicateResults.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-bold text-slate-900">
                            {lead.lead_id || "-"}
                          </div>
                          <div className="mt-1 text-sm text-slate-700">
                            {lead.customer_name || "-"}
                          </div>
                        </div>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                          Energy
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                        <div>
                          <span className="text-slate-400">Mobile</span>
                          <div className="font-semibold text-slate-700">{lead.mobile || "-"}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">NMI</span>
                          <div className="font-semibold text-slate-700">{lead.nmi || "-"}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Status</span>
                          <div className="font-semibold text-slate-700">{lead.status || "-"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowDuplicateResults(false)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="flex items-center gap-3">

        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        <div
          ref={notificationRef}
          className="relative"
        >

          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              setShowNotifications(
                (previous) => !previous
              );

              setShowProfileMenu(false);
            }}
            className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100"
          >

            <Bell size={21} />

            {unreadMsgCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow">
                {unreadMsgCount > 99
                  ? "99+"
                  : unreadMsgCount}
              </span>
            )}

          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">

                <p className="text-sm font-bold text-slate-800">
                  Notifications
                </p>

                {unreadMsgCount > 0 && (
                  <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600">
                    {unreadMsgCount} unread
                  </span>
                )}

              </div>

              {unreadMsgCount > 0 ? (
                <button
                  type="button"
                  onClick={openMessages}
                  className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
                >

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <MessageSquare
                      size={18}
                    />
                  </div>

                  <div>

                    <p className="text-sm font-semibold text-slate-800">
                      New messages
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      You have{" "}
                      {unreadMsgCount}{" "}
                      unread message
                      {unreadMsgCount !== 1
                        ? "s"
                        : ""}
                      .
                    </p>

                  </div>

                </button>
              ) : (
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

        {/* ====================================================
            MESSAGES
        ==================================================== */}

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

          {unreadMsgCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow">
              {unreadMsgCount > 99
                ? "99+"
                : unreadMsgCount}
            </span>
          )}

        </button>

        {/* ====================================================
            PROFILE MENU
        ==================================================== */}

        <div
          ref={profileMenuRef}
          className="relative ml-1 border-l border-slate-200 pl-4"
        >

          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(
                (previous) => !previous
              );

              setShowNotifications(false);
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

          {showProfileMenu && (
            <div className="absolute right-0 top-14 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">

              {/* ==============================================
                  PROFILE INFORMATION
              ============================================== */}

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

              {/* ==============================================
                  MY PROFILE
              ============================================== */}

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);

                  if (profile?.id) {
                    router.push(
                      `/users/${profile.id}`
                    );
                  }
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >

                <User size={17} />

                <span>
                  My Profile
                </span>

              </button>

              {/* ==============================================
                  SETTINGS
              ============================================== */}

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

              {/* ==============================================
                  LOGOUT
              ============================================== */}

              <div className="border-t border-slate-100 p-2">

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <LogOut size={17} />

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