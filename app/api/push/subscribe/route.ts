import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { message: "Invalid push subscription." },
      { status: 400 }
    );
  }

  const { error } = await adminSupabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
      },
      { onConflict: "endpoint" }
    );

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
