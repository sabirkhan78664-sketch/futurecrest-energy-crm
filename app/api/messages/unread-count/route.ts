import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Unread direct-message count for the logged-in user only. Counted here
// with the service-role client because RLS on crm_messages blocks browser
// reads (see FIXES_2408_1.md) — the header/sidebar badges used to query
// it from the browser and always got 0.
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, count: 0, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { count, error } = await adminSupabase
    .from("crm_messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("is_read", false);

  if (error) {
    return NextResponse.json(
      { success: false, count: 0, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, count: count ?? 0 });
}
