"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function sendMessage(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const senderId = formData.get("sender_id") as string;
  const recipientId = formData.get("recipient_id") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;
  const priority = formData.get("priority") as string;

  const { data: newMessage, error } = await supabase
    .from("messages")
    .insert({
      sender_id: senderId,
      subject,
      message,
      priority,
      message_type: "Private",
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  await supabase.from("message_recipients").insert({
    message_id: newMessage.id,
    recipient_id: recipientId,
  });
}