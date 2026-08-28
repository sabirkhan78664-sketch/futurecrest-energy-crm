import { supabase } from "./supabase";

export async function createNotification({
  userId,
  title,
  message,
  type,
  referenceId,
}: {
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: number;
}) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      reference_id: referenceId,
    });

  if (error) throw error;
}