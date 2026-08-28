import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const profile = await getCurrentUserProfile();

  if (!profile) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  if (profile.role !== "Admin" && profile.role !== "Super Admin") {
    return NextResponse.json(
      {
        success: false,
        message: "Only Admin or Super Admin can delete leads.",
      },
      { status: 403 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Delete matched 0 rows. This usually means a Row Level " +
          "Security DELETE policy on 'leads' is blocking this for " +
          "your role, or the lead id is wrong. Nothing was deleted.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}