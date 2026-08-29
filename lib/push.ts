import webpush from "web-push";
import { adminSupabase } from "@/lib/admin";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject =
  process.env.VAPID_SUBJECT || "mailto:support@futurecrestsolutions.com";

const vapidConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (vapidConfigured) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey!,
    vapidPrivateKey!
  );
}

// Sends a real OS-level push notification to every device the user has
// subscribed from. Missing VAPID config or a user with no subscriptions
// are both expected, silent no-ops — in-app notifications must never be
// blocked by push delivery.
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  if (!vapidConfigured) return;

  const { data: subscriptions, error } = await adminSupabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.error("Push subscription lookup error:", error);
    return;
  }

  if (!subscriptions?.length) return;

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          message
        );
      } catch (sendError) {
        // 404/410 means the browser dropped the subscription (e.g. the
        // user uninstalled, cleared site data). Prune it so we stop
        // trying to send to a dead endpoint.
        const statusCode =
          sendError instanceof webpush.WebPushError
            ? sendError.statusCode
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await adminSupabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
        } else {
          console.error("Push send error:", sendError);
        }
      }
    })
  );
}
