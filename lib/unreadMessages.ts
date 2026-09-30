// Client-safe helpers for the unread direct-message badges (header and
// sidebar). The count comes from /api/messages/unread-count because RLS
// on crm_messages blocks browser reads.

// Fired by the messages page after it marks messages read, so every
// badge refreshes immediately without polling.
export const UNREAD_MESSAGES_EVENT = "crm:unread-messages-changed";

// Returns null on failure so callers can keep the last known count.
export async function fetchUnreadMessageCount(): Promise<number | null> {
  try {
    const response = await fetch("/api/messages/unread-count", {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = await response.json();

    return typeof data.count === "number" ? data.count : null;
  } catch {
    return null;
  }
}

export function notifyUnreadMessagesChanged() {
  window.dispatchEvent(new Event(UNREAD_MESSAGES_EVENT));
}
