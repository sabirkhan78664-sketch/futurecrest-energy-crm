import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createNotification } from "@/lib/notifications";

// Channel Partners are external — they may only reach the internal team
// roles that actually handle their leads, never Agents or other Partners.
const PARTNER_VISIBLE_ROLES = ["Closer", "Admin", "Super Admin", "QA"];

async function getMe() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (error || !profile) return null;
  return profile;
}

export async function GET(req: NextRequest) {
  const me = await getMe();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const contactId = req.nextUrl.searchParams.get("contact_id");

  if (contactId) {
    const { data: contact } = await adminSupabase
      .from("profiles")
      .select("id, employee_id, full_name, role, status, can_send_messages, can_receive_messages")
      .eq("id", contactId)
      .maybeSingle();

    if (!contact) return NextResponse.json({ message: "User not found" }, { status: 404 });

    if (
      me.role === "Channel Partner" &&
      !PARTNER_VISIBLE_ROLES.includes(contact.role)
    ) {
      return NextResponse.json({ message: "You cannot message this user." }, { status: 403 });
    }

    const { data: messages, error } = await adminSupabase
      .from("crm_messages")
      .select("*")
      .is("group_id", null)
      .or(
        `and(sender_id.eq.${me.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${me.id})`
      )
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    return NextResponse.json({ contact, messages: messages || [] });
  }

  // Load the complete profile list first and normalize status in code.
  // Some existing CRM rows use a different case/format for Active. A
  // case-sensitive .eq("status", "Active") made the New Chat modal show
  // "No users available" even though users existed.
  let profileQuery = adminSupabase
    .from("profiles")
    .select("id, employee_id, full_name, role, status, can_send_messages, can_receive_messages")
    .neq("id", me.id)
    .order("full_name");

  if (me.role === "Channel Partner") {
    profileQuery = profileQuery.in("role", PARTNER_VISIBLE_ROLES);
  }

  const { data: profileRows, error: usersError } = await profileQuery;

  if (usersError) return NextResponse.json({ message: usersError.message }, { status: 400 });

  const users = (profileRows || []).filter((u: any) => {
    const status = String(u.status ?? "").trim().toLowerCase();
    return status === "active";
  });

  const { data: direct, error: messagesError } = await adminSupabase
    .from("crm_messages")
    .select("id, sender_id, receiver_id, is_read, created_at")
    .is("group_id", null)
    .or(`sender_id.eq.${me.id},receiver_id.eq.${me.id}`)
    .order("created_at", { ascending: true });

  if (messagesError) return NextResponse.json({ message: messagesError.message }, { status: 400 });

  const unread: Record<string, number> = {};
  const partners = new Set<string>();
  const lastMessageAt: Record<string, string> = {};

  for (const m of direct || []) {
    const partner = m.sender_id === me.id ? m.receiver_id : m.sender_id;
    if (!partner || partner === me.id) continue;
    partners.add(partner);
    if (m.receiver_id === me.id && !m.is_read) {
      unread[partner] = (unread[partner] || 0) + 1;
    }
    // `direct` is ordered by created_at ascending, so the last time we see
    // a given partner in this loop is their most recent message.
    lastMessageAt[partner] = m.created_at;
  }

  const chatUsers = (users || [])
    .filter((u: any) => partners.has(u.id))
    .map((u: any) => ({ ...u, unreadCount: unread[u.id] || 0 }))
    .sort(
      (a: any, b: any) =>
        new Date(lastMessageAt[b.id]).getTime() -
        new Date(lastMessageAt[a.id]).getTime()
    );

  return NextResponse.json({
    currentUser: me,
    users: users || [],
    chatUsers,
  });
}

export async function POST(req: NextRequest) {
  const me = await getMe();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (me.can_send_messages === false) {
    return NextResponse.json({ message: "Your chat access has been disabled by the Administrator." }, { status: 403 });
  }

  const body = await req.json();
  const receiverId = String(body.receiver_id || "");
  const message = String(body.message || "");
  const attachmentUrl = body.attachment_url || null;
  const replyToId = body.reply_to_id ?? null;
  const mentionedIds = Array.isArray(body.mentioned_ids) ? body.mentioned_ids : [];

  if (!receiverId) return NextResponse.json({ message: "Receiver is required" }, { status: 400 });
  if (!message.trim() && !attachmentUrl) return NextResponse.json({ message: "Message is empty" }, { status: 400 });

  const { data: receiver } = await adminSupabase
    .from("profiles")
    .select("id, role, can_receive_messages, status")
    .eq("id", receiverId)
    .maybeSingle();

  if (!receiver) return NextResponse.json({ message: "Receiver not found" }, { status: 404 });
  if (receiver.can_receive_messages === false) {
    return NextResponse.json({ message: "This user is not allowed to receive messages." }, { status: 403 });
  }
  if (
    me.role === "Channel Partner" &&
    !PARTNER_VISIBLE_ROLES.includes(receiver.role)
  ) {
    return NextResponse.json({ message: "You cannot message this user." }, { status: 403 });
  }

  const { data, error } = await adminSupabase
    .from("crm_messages")
    .insert({
      sender_id: me.id,
      receiver_id: receiverId,
      group_id: null,
      message: message.trim(),
      attachment_url: attachmentUrl,
      is_read: false,
      read_by: [me.id],
      edited_at: null,
      is_pinned: false,
      reply_to_id: replyToId,
      mentioned_ids: mentionedIds,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 400 });

  try {
    const preview = message.trim();
    await createNotification({
      userId: receiverId,
      title: `New message from ${me.full_name || me.employee_id}`,
      message: preview
        ? preview.length > 120
          ? `${preview.slice(0, 117)}...`
          : preview
        : "Sent an attachment",
      type: "direct_message",
      referenceId: data.id,
      url: "/messages",
    });
  } catch (notificationError) {
    // Message send must succeed regardless of notification/push delivery.
    console.error("Direct message notification error:", notificationError);
  }

  return NextResponse.json({ message: data });
}

export async function PATCH(req: NextRequest) {
  const me = await getMe();
  if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const contactId = String(body.contact_id || "");
  if (!contactId) return NextResponse.json({ message: "Contact is required" }, { status: 400 });

  const { error } = await adminSupabase
    .from("crm_messages")
    .update({ is_read: true })
    .eq("sender_id", contactId)
    .eq("receiver_id", me.id)
    .eq("is_read", false)
    .is("group_id", null);

  if (error) return NextResponse.json({ message: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
