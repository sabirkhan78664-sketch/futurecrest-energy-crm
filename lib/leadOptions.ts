// Single source of truth for the standard Channel Name options, shared
// by every hardcoded Channel Name <select> (Lead Disposition, Closer
// Process Lead) and the Leads filter's channel option list. Client-safe
// (no server-only imports) so it can be used from "use client" files.
export const CHANNEL_OPTIONS = ["Mango", "Umbrella", "Brother", "Banana", "UD"];
