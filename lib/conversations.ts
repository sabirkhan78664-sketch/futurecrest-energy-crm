import { supabase } from "./supabase";

export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      user1:profiles!conversations_user_one_fkey(
        id,
        employee_id,
        full_name,
        role
      ),
      user2:profiles!conversations_user_two_fkey(
        id,
        employee_id,
        full_name,
        role
      )
    `)
    .or(`user_one.eq.${userId},user_two.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function createConversation(
  userOne: string,
  userTwo: string
) {
  const { data, error } = await supabase
    .from("conversations")
    .insert([
      {
        user_one: userOne,
        user_two: userTwo,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
}