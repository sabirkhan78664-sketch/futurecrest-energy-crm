import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PREFIX: Record<string, string> = {
  "Super Admin": "FCSSADM",
  "Admin": "FCSADMN",
  "Agent": "FCSAGENT",
  "Closer": "FCSCLSR",
  "QA": "FCSQA",
  "Channel Partner": "FCSCHP",
};

export async function generateEmployeeId(role: string) {
  const prefix = PREFIX[role];

  if (!prefix) {
    throw new Error("Invalid role");
  }

  const { data, error } = await admin
    .from("profiles")
    .select("employee_number")
    .eq("role", role)
    .order("employee_number", { ascending: false })
    .limit(1);

  if (error) throw error;

  const nextNumber =
    data && data.length > 0
      ? (data[0].employee_number ?? 0) + 1
      : 1;

  return {
    employeeId: `${prefix}${String(nextNumber).padStart(3, "0")}`,
    employeeNumber: nextNumber,
  };
}