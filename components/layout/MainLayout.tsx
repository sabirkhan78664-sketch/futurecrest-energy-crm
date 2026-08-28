"use client";

import {
  useState,
  useEffect,
  ReactNode,
} from "react";

import {
  useRouter,
  usePathname,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

import Sidebar from "./Sidebar";
import HeaderNav from "./HeaderNav";
import PresenceProvider from "./PresenceProvider";
import PageNavigation from "@/components/navigation/PageNavigation";

import {
  MessageSquare,
  X,
  Bell,
} from "lucide-react";

interface Profile {
  id: string;
  role: string;
  full_name: string;
  employee_id: string;
}

interface MainLayoutProps {
  children: ReactNode;
}

interface SidebarStats {
  pendingApproval: number;
  unreadMessages: number;
  followUpsToday: number;
  qaPending?: number;
}

interface IncomingMessage {
  sender_id: string;
  sender_name: string;
  message: string;
}

interface PendingNotification {
  lead_id: number;
  customer_name: string;
  mobile?: string;
}

export default function MainLayout({
  children,
}: MainLayoutProps) {
  const router = useRouter();

  /*
   * pathname is declared ONLY ONCE.
   */
  const pathname = usePathname();

  /*
   * Messages gets a full-height / full-width workspace.
   */
  const isMessagesPage =
    pathname === "/messages" ||
    pathname.startsWith("/messages/");

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [sidebarStats, setSidebarStats] =
    useState<SidebarStats>({
      pendingApproval: 0,
      unreadMessages: 0,
      followUpsToday: 0,
      qaPending: 0,
    });

  const [incomingMsg, setIncomingMsg] =
    useState<IncomingMessage | null>(null);

  const [pendingNotification, setPendingNotification] =
    useState<PendingNotification | null>(null);

  /*
   * ============================================================
   * LOAD PROFILE + SIDEBAR COUNTS
   * ============================================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadUserData() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(
          "Authentication error:",
          authError
        );

        router.push("/login");
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      /*
       * Load profile
       */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "Failed to load profile:",
          profileError
        );

        return;
      }

      if (!profileData || !mounted) {
        return;
      }

      const loadedProfile =
        profileData as Profile;

      setProfile(loadedProfile);

      /*
       * ========================================================
       * UNREAD MESSAGES
       * ========================================================
       */

      const {
        count: unreadCount,
        error: unreadError,
      } = await supabase
        .from("crm_messages")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "receiver_id",
          loadedProfile.id
        )
        .eq(
          "is_read",
          false
        );

      if (unreadError) {
        console.error(
          "Failed to load unread messages:",
          unreadError
        );
      }

      /*
       * ========================================================
       * PENDING APPROVAL
       * ========================================================
       */

      let pendingApproval = 0;

      if (
        loadedProfile.role === "Admin" ||
        loadedProfile.role === "Super Admin"
      ) {
        const {
          count,
          error,
        } = await supabase
          .from("leads")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "approval_status",
            "Pending"
          );

        if (error) {
          console.error(
            "Failed to load pending approvals:",
            error
          );
        } else {
          pendingApproval =
            count ?? 0;
        }
      }

      /*
       * ========================================================
       * QA PENDING
       * ========================================================
       */

      let qaPending = 0;

      if (
        loadedProfile.role === "QA"
      ) {
        const {
          count,
          error: qaError,
        } = await supabase
          .from("leads")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "status",
            "Sold"
          )
          .not(
            "qa_status",
            "in",
            "(Approved,Rejected)"
          );

        if (qaError) {
          console.error(
            "Failed to load QA count:",
            qaError
          );
        } else {
          qaPending =
            count ?? 0;
        }
      }

      /*
       * ========================================================
       * SET COUNTS
       * ========================================================
       */

      if (mounted) {
        setSidebarStats({
          pendingApproval,
          unreadMessages:
            unreadCount ?? 0,
          followUpsToday: 0,
          qaPending,
        });
      }
    }

    void loadUserData();

    return () => {
      mounted = false;
    };
  }, [router]);

  /*
   * ============================================================
   * REALTIME QA COUNT
   * ============================================================
   */

  useEffect(() => {
    if (
      !profile?.id ||
      profile.role !== "QA"
    ) {
      return;
    }

    let mounted = true;

    async function refreshQaCount() {
      const {
        count,
        error,
      } = await supabase
        .from("leads")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "status",
          "Sold"
        )
        .not(
          "qa_status",
          "in",
          "(Approved,Rejected)"
        );

      if (
        !error &&
        mounted
      ) {
        setSidebarStats(
          (previous) => ({
            ...previous,
            qaPending:
              count ?? 0,
          })
        );
      }
    }

    void refreshQaCount();

    const channel =
      supabase
        .channel(
          `qa-available-count-${profile.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "leads",
          },
          () =>
            void refreshQaCount()
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "leads",
          },
          () =>
            void refreshQaCount()
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "leads",
          },
          () =>
            void refreshQaCount()
        )
        .subscribe();

    return () => {
      mounted = false;

      void supabase.removeChannel(
        channel
      );
    };
  }, [
    profile?.id,
    profile?.role,
  ]);

  /*
   * ============================================================
   * REALTIME PENDING APPROVALS
   * ============================================================
   */

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    if (
      profile.role !== "Admin" &&
      profile.role !== "Super Admin"
    ) {
      return;
    }

    let mounted = true;

    let channel:
      | ReturnType<
          typeof supabase.channel
        >
      | null = null;

    let reconnectTimer:
      | number
      | null = null;

    let reconnectAttempt = 0;

    let connecting = false;

    /*
     * Refresh pending approval count.
     */

    async function refreshPendingCount() {
      try {
        const {
          count,
          error,
        } = await supabase
          .from("leads")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "approval_status",
            "Pending"
          );

        if (error) {
          console.error(
            "Failed to refresh pending approvals:",
            error
          );

          return;
        }

        if (!mounted) {
          return;
        }

        setSidebarStats(
          (previous) => ({
            ...previous,
            pendingApproval:
              count ?? 0,
          })
        );
      } catch (error) {
        console.error(
          "Pending approval refresh error:",
          error
        );
      }
    }

    /*
     * Reconnect.
     */

    function scheduleReconnect() {
      if (
        !mounted ||
        reconnectTimer !== null
      ) {
        return;
      }

      reconnectAttempt += 1;

      const delay =
        Math.min(
          15000,
          2000 *
            Math.pow(
              2,
              reconnectAttempt - 1
            )
        );

      reconnectTimer =
        window.setTimeout(
          () => {
            reconnectTimer = null;

            if (!mounted) {
              return;
            }

            connectRealtime();
          },
          delay
        );
    }

    /*
     * Connect realtime.
     */

    function connectRealtime() {
      if (
        !mounted ||
        connecting
      ) {
        return;
      }

      connecting = true;

      if (channel) {
        connecting = false;
        return;
      }

      /*
       * IMPORTANT:
       * profile is nullable in React state.
       * Make a safe local reference before using it.
       */

      const currentProfile = profile;

      if (!currentProfile?.id) {
        connecting = false;
        return;
      }

      const profileId =
        currentProfile.id;

      const channelName =
        `pending-approvals-${profileId}-${crypto.randomUUID()}`;

      const newChannel =
        supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "leads",
            },
            () => {
              void refreshPendingCount();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "leads",
            },
            () => {
              void refreshPendingCount();
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: "leads",
            },
            () => {
              void refreshPendingCount();
            }
          )
          .subscribe(
            (status) => {
              connecting = false;

              if (
                status === "SUBSCRIBED"
              ) {
                reconnectAttempt = 0;
                return;
              }

              if (
                status === "CHANNEL_ERROR" ||
                status === "TIMED_OUT"
              ) {
                channel = null;
                scheduleReconnect();
              }
            }
          );

      channel =
        newChannel;
    }

    void refreshPendingCount();

    connectRealtime();

    return () => {
      mounted = false;

      if (
        reconnectTimer !== null
      ) {
        window.clearTimeout(
          reconnectTimer
        );

        reconnectTimer = null;
      }

      const channelToRemove =
        channel;

      channel = null;

      if (channelToRemove) {
        try {
          void supabase.removeChannel(
            channelToRemove
          );
        } catch (error) {
          console.warn(
            "Pending approval cleanup:",
            error
          );
        }
      }
    };
  }, [
    profile?.id,
    profile?.role,
  ]);

  /*
   * ============================================================
   * REALTIME MESSAGE POPUP
   * ============================================================
   */

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    const currentProfile =
      profile;

    const channel =
      supabase
        .channel(
          `message-popup-${currentProfile.id}-${crypto.randomUUID()}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "crm_messages",
            filter:
              `receiver_id=eq.${currentProfile.id}`,
          },
          async (payload) => {
            const newMsg =
              payload.new as {
                id: number;
                sender_id: string;
                receiver_id: string;
                message?: string;
              };

            if (
              newMsg.receiver_id !==
              currentProfile.id
            ) {
              return;
            }

            /*
             * Don't show popup while
             * already inside Messages.
             */

            if (
              pathname === "/messages" ||
              pathname.startsWith(
                "/messages/"
              )
            ) {
              return;
            }

            const {
              data: senderData,
            } = await supabase
              .from("profiles")
              .select("full_name")
              .eq(
                "id",
                newMsg.sender_id
              )
              .single();

            setIncomingMsg({
              sender_id:
                newMsg.sender_id,
              sender_name:
                senderData?.full_name ||
                "New Message",
              message:
                newMsg.message ||
                "Sent you a message",
            });

            setSidebarStats(
              (previous) => ({
                ...previous,
                unreadMessages:
                  previous.unreadMessages +
                  1,
              })
            );

            /*
             * Notification sound.
             */

            try {
              const audio =
                new Audio(
                  "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
                );

              void audio
                .play()
                .catch(() => {});
            } catch {
              // Ignore browser audio restrictions.
            }

            window.setTimeout(
              () => {
                setIncomingMsg(
                  null
                );
              },
              6000
            );
          }
        )
        .subscribe();

    return () => {
      try {
        void supabase.removeChannel(
          channel
        );
      } catch (error) {
        console.warn(
          "Message channel cleanup:",
          error
        );
      }
    };
  }, [
    profile?.id,
    pathname,
  ]);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-600">
            Loading workspace...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            FutureCrest CRM
          </p>

        </div>
      </div>
    );
  }

  /*
   * At this point profile is guaranteed to exist.
   */

  const currentProfile: Profile =
    profile;

  /*
   * ============================================================
   * MAIN UI
   * ============================================================
   */

  return (
    <PresenceProvider
      userId={profile.id}
    >
      <div className="flex h-screen overflow-hidden bg-slate-50">

        {/* SIDEBAR */}

        <Sidebar
          profile={currentProfile}
          stats={sidebarStats}
        />

        {/* MAIN CONTENT */}

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">

          <HeaderNav
            profile={currentProfile}
            pendingApproval={
              sidebarStats.pendingApproval
            }
          />

          <main
            className={
              isMessagesPage
                ? "relative z-10 flex min-h-0 flex-1 overflow-hidden"
                : "relative z-10 flex-1 overflow-y-auto p-6"
            }
          >

            {!isMessagesPage && (
              <PageNavigation />
            )}

            {children}

          </main>

        </div>

        {/* ====================================================
            PENDING APPROVAL POPUP
        ==================================================== */}

        {pendingNotification && (
          <div className="fixed bottom-6 right-6 z-[9999]">

            <div
              onClick={() => {
                setPendingNotification(
                  null
                );

                router.push(
                  "/pending-approvals"
                );
              }}
              className="flex w-[380px] cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-2xl transition hover:bg-amber-50"
            >

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow">
                <Bell size={21} />
              </div>

              <div className="min-w-0 flex-1">

                <div className="flex items-center justify-between gap-3">

                  <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    New Pending Approval
                  </p>

                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />

                </div>

                <p className="mt-1 text-sm font-bold text-slate-900">
                  {
                    pendingNotification.customer_name
                  }
                </p>

                {pendingNotification.mobile && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {
                      pendingNotification.mobile
                    }
                  </p>
                )}

                <p className="mt-2 text-xs font-medium text-blue-600">
                  Click to review pending approval →
                </p>

              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();

                  setPendingNotification(
                    null
                  );
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>

            </div>

          </div>
        )}

        {/* ====================================================
            NEW MESSAGE POPUP
        ==================================================== */}

        {incomingMsg && (
          <div className="fixed bottom-6 right-6 z-[9998]">

            <div
              onClick={() => {
                const id =
                  incomingMsg.sender_id;

                setIncomingMsg(
                  null
                );

                router.push(
                  `/messages?user=${id}`
                );
              }}
              className="flex w-80 cursor-pointer items-start gap-3 rounded-2xl border border-slate-700 bg-slate-900 p-4 text-white shadow-2xl"
            >

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600">
                <MessageSquare size={20} />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  New Message
                </p>

                <p className="mt-1 truncate text-sm font-bold">
                  {
                    incomingMsg.sender_name
                  }
                </p>

                <p className="mt-1 truncate text-xs text-slate-300">
                  {
                    incomingMsg.message
                  }
                </p>

              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();

                  setIncomingMsg(
                    null
                  );
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>

            </div>

          </div>
        )}

      </div>
    </PresenceProvider>
  );
}