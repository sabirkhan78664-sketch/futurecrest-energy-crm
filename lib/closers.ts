import { supabase } from "./supabase";

/* ===========================
   GET ALL CLOSERS
=========================== */
export async function getClosers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "Closer")
    .order("employee_id", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

/* ===========================
   GET SINGLE CLOSER
=========================== */
export async function getCloser(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}