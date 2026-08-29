import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// =======================================
// UPDATE USER
// =======================================
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ---------------------------------------
    // CHECK CURRENT LOGGED-IN USER
    // ---------------------------------------
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login again.",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------
    // CHECK CURRENT USER ROLE
    // ---------------------------------------
    const { data: currentProfile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, role, status")
        .eq("id", currentUser.id)
        .single();

    if (profileError || !currentProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Current user profile not found.",
        },
        { status: 403 }
      );
    }

    if (currentProfile.role !== "Super Admin") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only Super Admin can modify users.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------
    // READ REQUEST
    // ---------------------------------------
    const body = await req.json();

    const {
      full_name,
      phone,
      role,
      status,
      username,
      employee_id,
      employee_number,
      email,
      can_send_messages,
      can_receive_messages,
    } = body;

    // ---------------------------------------
    // PREVENT EMPTY USER NAME
    // ---------------------------------------
    if (
      full_name !== undefined &&
      !String(full_name).trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name is required.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // VALID ROLES
    // ---------------------------------------
    const validRoles = [
      "Super Admin",
      "Admin",
      "Agent",
      "Closer",
      "QA",
      "Channel Partner",
    ];

    if (
      role !== undefined &&
      !validRoles.includes(role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user role.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // VALID STATUS
    // ---------------------------------------
    const validStatuses = [
      "Active",
      "Suspended",
      "Inactive",
    ];

    if (
      status !== undefined &&
      !validStatuses.includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user status.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // UPDATE AUTH EMAIL
    // ---------------------------------------
    if (
      email &&
      typeof email === "string"
    ) {
      const {
        data: targetAuthUser,
        error: targetAuthError,
      } =
        await adminSupabase.auth.admin.getUserById(
          id
        );

      if (targetAuthError) {
        return NextResponse.json(
          {
            success: false,
            message:
              targetAuthError.message,
          },
          { status: 400 }
        );
      }

      if (
        targetAuthUser.user?.email !==
        email
      ) {
        const {
          error: authError,
        } =
          await adminSupabase.auth.admin.updateUserById(
            id,
            {
              email,
            }
          );

        if (authError) {
          return NextResponse.json(
            {
              success: false,
              message:
                authError.message,
            },
            { status: 400 }
          );
        }
      }
    }

    // ---------------------------------------
    // UPDATE PROFILE
    // ---------------------------------------
    const profileUpdate: Record<
      string,
      any
    > = {};

    if (
      full_name !== undefined
    ) {
      profileUpdate.full_name =
        String(full_name).trim();
    }

    if (
      phone !== undefined
    ) {
      profileUpdate.phone =
        phone || null;
    }

    if (
      role !== undefined
    ) {
      profileUpdate.role =
        role;
    }

    if (
      status !== undefined
    ) {
      profileUpdate.status =
        status;
    }

    if (
      username !== undefined
    ) {
      profileUpdate.username =
        username || null;
    }

    if (
      employee_id !== undefined
    ) {
      profileUpdate.employee_id =
        employee_id || null;
    }

    if (
      employee_number !== undefined
    ) {
      profileUpdate.employee_number =
        employee_number || null;
    }

    if (
      email !== undefined
    ) {
      profileUpdate.email =
        email || null;
    }

    if (
      can_send_messages !==
      undefined
    ) {
      profileUpdate.can_send_messages =
        Boolean(
          can_send_messages
        );
    }

    if (
      can_receive_messages !==
      undefined
    ) {
      profileUpdate.can_receive_messages =
        Boolean(
          can_receive_messages
        );
    }

    const {
      data,
      error,
    } =
      await adminSupabase
        .from("profiles")
        .update(
          profileUpdate
        )
        .eq("id", id)
        .select()
        .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message:
            error.message,
        },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // SUCCESS
    // ---------------------------------------
    return NextResponse.json(
      {
        success: true,
        message:
          "User updated successfully.",
        data,
      },
      { status: 200 }
    );

  } catch (err: any) {
    console.error(
      "❌ UPDATE USER API ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        message:
          err?.message ||
          "Internal server error.",
      },
      { status: 500 }
    );
  }
}

// =======================================
// DELETE USER
// =======================================
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ---------------------------------------
    // CHECK CURRENT LOGGED-IN USER
    // ---------------------------------------
    const supabase =
      await createSupabaseServerClient();

    const {
      data: { user: currentUser },
    } =
      await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    // ---------------------------------------
    // CHECK CURRENT USER ROLE
    // ---------------------------------------
    const {
      data: currentProfile,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

    if (
      !currentProfile ||
      currentProfile.role !==
        "Super Admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Access denied. Only Super Admin can delete users.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------
    // PREVENT SELF DELETE
    // ---------------------------------------
    if (id === currentUser.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot delete your own account.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // DELETE PROFILE
    // ---------------------------------------
    const {
      error: profileError,
    } =
      await adminSupabase
        .from("profiles")
        .delete()
        .eq("id", id);

    if (profileError) {
      return NextResponse.json(
        {
          success: false,
          message:
            profileError.message,
        },
        { status: 400 }
      );
    }

    // ---------------------------------------
    // DELETE AUTH USER
    // ---------------------------------------
    const {
      error: authError,
    } =
      await adminSupabase.auth.admin.deleteUser(
        id
      );

    if (authError) {
      return NextResponse.json(
        {
          success: false,
          message:
            authError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "User deleted successfully.",
      },
      { status: 200 }
    );

  } catch (err: any) {
    console.error(
      "❌ DELETE USER API ERROR:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        message:
          err?.message ||
          "Internal server error.",
      },
      { status: 500 }
    );
  }
}