import { supabase } from "./supabase";

export async function getUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*");

  console.log("USERS:", data);
  console.log("ERROR:", error);

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export async function updateUserRole(
  id: string,
  role: string
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      role,
    })
    .eq("id", id);

  if (error) throw error;

  return true;
}

export async function updateUserStatus(
  id: string,
  status: string
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      status,
    })
    .eq("id", id);

  if (error) throw error;

  return true;
}

export async function deleteUser(id: string) {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}