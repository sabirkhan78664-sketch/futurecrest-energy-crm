// Client-safe helpers for the unread direct-message badges (header and
// sidebar). The count comes from /api/messages/unread-count because RLS
// on crm_messages blocks browser reads.

// Fired by the messages page after it marks messages read, so every
// badge refreshes immediately without polling.
export const UNREAD_MESSAGES_EVENT = "crm:unread-messages-changed";

// The header and sidebar both ask for this on every navigation. Callers
// arriving while a request is already in flight share its result instead
// of sending a second identical request (never serves an old answer).
let inFlight: Promise<number | null> | null = null;

// Returns null on failure so callers can keep the last known count.
export function fetchUnreadMessageCount(): Promise<number | null> {
  if (!inFlight) {
    inFlight = requestUnreadMessageCount().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}

async function requestUnreadMessageCount(): Promise<number | null> {
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
