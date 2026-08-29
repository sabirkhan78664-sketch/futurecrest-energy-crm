"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Public routes that must be reachable with no session at all — the
// partner lead intake form is meant to be filled in by people who have
// never logged into the CRM.
const PUBLIC_PATHS = ["/submit"];

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Registers the service worker and subscribes for Web Push right after
// login. Every step is wrapped so an unsupported browser, a denied
// permission, or a network hiccup never blocks the rest of the app — the
// in-app notification bell must keep working regardless.
async function setupPushNotifications() {
  try {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      return;
    }

    const vapidPublicKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) return;

    const registration = await navigator.serviceWorker.register(
      "/sw.js"
    );

    const permission = await Notification.requestPermission();

    if (permission !== "granted") return;

    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    const json = subscription.toJSON();

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });
  } catch (error) {
    console.error("Push notification setup failed:", error);
  }
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isPublicPath) return;

    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      void setupPushNotifications();
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push("/login");
      } else if (event === "SIGNED_IN") {
        void setupPushNotifications();
      }
    });

    return () => subscription.unsubscribe();
  }, [router, isPublicPath]);

  return <>{children}</>;
}