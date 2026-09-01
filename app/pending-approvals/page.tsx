import { redirect } from "next/navigation";

// The approval gate was removed — leads are visible immediately, so
// there's nothing left to review here. Kept as a redirect rather than
// deleted so old links/bookmarks still land somewhere useful.
export default function PendingApprovalsPage() {
  redirect("/leads");
}
