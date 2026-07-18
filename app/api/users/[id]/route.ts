import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";

// ================================
// UPDATE USER
// ================================
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await req.json();

    const { full_name, phone, role, status } = body;

    const { data, error } = await adminSupabase
      .from("users")
      .update({
        full_name,
        phone,
        role,
        status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message,
      },
      { status: 500 }
    );
  }
}

// ================================
// DELETE USER
// ================================
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find auth_id
    const { data: user, error: findError } = await adminSupabase
      .from("users")
      .select("auth_id")
      .eq("id", id)
      .single();

    if (findError) {
      return NextResponse.json(
        {
          success: false,
          message: findError.message,
        },
        { status: 400 }
      );
    }

    // Delete database record
    const { error: deleteError } = await adminSupabase
      .from("users")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          message: deleteError.message,
        },
        { status: 400 }
      );
    }

    // Delete auth user (if exists)
    if (user?.auth_id) {
      const { error: authError } =
        await adminSupabase.auth.admin.deleteUser(user.auth_id);

      if (authError) {
        console.error(authError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message,
      },
      { status: 500 }
    );
  }
}