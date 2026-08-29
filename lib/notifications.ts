import { adminSupabase } from "./admin";
import { sendPushToUser } from "./push";

export async function createNotification({
  userId,
  title,
  message,
  type,
  referenceId,
  url,
}: {
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: number;
  url?: string;
}) {
  const { error } = await adminSupabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      reference_id: referenceId,
    });

  if (error) throw error;

  // A push delivery failure (no subscription, expired endpoint, VAPID not
  // configured) must never fail the notification itself — the in-app bell
  // already has the row and must keep working regardless.
  try {
    await sendPushToUser(userId, { title, body: message, url });
  } catch (pushError) {
    console.error("Push notification error:", pushError);
  }
}