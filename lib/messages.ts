import { supabase } from "./supabase";

export async function getMessages(
  conversationId: number
) {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:profiles(
        id,
        employee_id,
        full_name
      )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function sendMessage(
  conversationId: number,
  senderId: string,
  message: string
) {
  const { error } = await supabase
    .from("messages")
    .insert([
      {
        conversation_id: conversationId,
        sender_id: senderId,
        message,
      },
    ]);

  if (error) throw error;
}

export async function markAsRead(
  conversationId: number,
  currentUserId: string
) {
  const { error } = await supabase
    .from("messages")
    .update({
      is_read: true,
    })
    .eq("conversation_id", conversationId)
    .neq("sender_id", currentUserId);

  if (error) {
    console.error(error);
  }
}
export async function getUnreadCount(userId: string) {
  const { count, error } = await supabase
    .from("messages")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("is_read", false)
    .neq("sender_id", userId);

  if (error) {
    console.error(error);
    return 0;
  }

  return count ?? 0;
}