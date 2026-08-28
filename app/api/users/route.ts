import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/* ============================================================
   GENERATE TEMPORARY PASSWORD
============================================================ */

function generatePassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

  const special = "!@#$%^&*";

  let password = "";

  for (let i = 0; i < 10; i++) {
    password +=
      chars[
        Math.floor(
          Math.random() * chars.length
        )
      ];
  }

  password +=
    special[
      Math.floor(
        Math.random() * special.length
      )
    ];

  password += Math.floor(
    Math.random() * 10
  );

  return password;
}

/* ============================================================
   ROLE PREFIX
============================================================ */

function rolePrefix(role: string) {
  switch (role) {
    case "Agent":
      return "AGT";

    case "Closer":
      return "CLR";

    case "QA":
      return "QA";

    case "Admin":
      return "ADM";

    case "Super Admin":
      return "SAD";

    case "Channel Partner":
      return "CHP";

    default:
      return "USR";
  }
}

/* ============================================================
   POST - CREATE USER
============================================================ */

export async function POST(request: Request) {
  let createdAuthUserId: string | null = null;

  try {
    /* ========================================================
       CHECK CURRENT LOGGED-IN USER
    ======================================================== */

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

    /* ========================================================
       CHECK CURRENT USER ROLE
    ======================================================== */

    const { data: currentProfile, error: profileCheckError } =
      await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", currentUser.id)
        .single();

    if (profileCheckError || !currentProfile) {
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
            "Access denied. Only Super Admin can create users.",
        },
        { status: 403 }
      );
    }

    /* ========================================================
       SUPABASE CONFIG
    ======================================================== */

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing Supabase service-role configuration.",
        },
        { status: 500 }
      );
    }

    /* ========================================================
       READ REQUEST
    ======================================================== */

    const body = await request.json();

    const fullName = String(
      body.full_name || ""
    ).trim();

    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();

    const phone = String(
      body.phone || ""
    ).trim();

    const role = String(
      body.role || "Agent"
    ).trim();

    const status = String(
      body.status || "Active"
    ).trim();

    const canSend =
      body.can_send_messages !== undefined
        ? Boolean(body.can_send_messages)
        : true;

    const canReceive =
      body.can_receive_messages !== undefined
        ? Boolean(body.can_receive_messages)
        : true;

    /* ========================================================
       VALIDATION
    ======================================================== */

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Company email is required.",
        },
        { status: 400 }
      );
    }

    const validRoles = [
      "Agent",
      "Closer",
      "QA",
      "Admin",
      "Super Admin",
      "Channel Partner",
    ];

    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user role.",
        },
        { status: 400 }
      );
    }

    const validStatuses = [
      "Active",
      "Inactive",
      "Suspended",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid user status.",
        },
        { status: 400 }
      );
    }

    /* ========================================================
       GENERATE PASSWORD
    ======================================================== */

    const password =
      String(
        body.temporary_password ||
          body.password ||
          ""
      ).trim() || generatePassword();

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    /* ========================================================
       GET NEXT EMPLOYEE NUMBER

       employee_number = INTEGER
    ======================================================== */

    const employeeNumberResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?select=employee_number&employee_number=not.is.null&order=employee_number.desc&limit=1`,
        {
          method: "GET",
          headers: {
            apikey: serviceKey,
            Authorization:
              `Bearer ${serviceKey}`,
          },
        }
      );

    const employeeNumberText =
      await employeeNumberResponse.text();

    let employeeNumberData: any[] = [];

    if (employeeNumberText.trim()) {
      try {
        employeeNumberData =
          JSON.parse(
            employeeNumberText
          );
      } catch {
        throw new Error(
          "Could not read existing employee numbers."
        );
      }
    }

    if (!employeeNumberResponse.ok) {
      throw new Error(
        employeeNumberData?.[0]?.message ||
          "Failed to get employee number."
      );
    }

    const lastEmployeeNumber =
      Number(
        employeeNumberData?.[0]
          ?.employee_number || 0
      );

    const employeeNumber =
      Number.isFinite(
        lastEmployeeNumber
      )
        ? lastEmployeeNumber + 1
        : 1;

    /* ========================================================
       EMPLOYEE ID

       Examples:

       FCS-AGT-001
       FCS-CLR-001
       FCS-QA-001
       FCS-ADM-001
       FCS-SAD-001
    ======================================================== */

    const employeeId =
      `FCS-${rolePrefix(
        role
      )}-${String(
        employeeNumber
      ).padStart(3, "0")}`;

    /* ========================================================
       USERNAME
    ======================================================== */

    const cleanName =
      fullName
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          ""
        );

    const username =
      `${cleanName || "user"}_${employeeNumber}`;

    /* ========================================================
       CREATE SUPABASE AUTH USER

       IMPORTANT:
       Your database trigger:

       on_auth_user_created
                ↓
       handle_new_user()
                ↓
       creates profiles row

       Therefore we DO NOT insert profiles here.
    ======================================================== */

    const authResponse =
      await fetch(
        `${supabaseUrl}/auth/v1/admin/users`,
        {
          method: "POST",

          headers: {
            apikey: serviceKey,

            Authorization:
              `Bearer ${serviceKey}`,

            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,

            password,

            email_confirm: true,

            user_metadata: {
              full_name:
                fullName,

              phone,

              role,

              status,

              username,

              employee_id:
                employeeId,

              employee_number:
                employeeNumber,
            },
          }),
        }
      );

    /* ========================================================
       READ AUTH RESPONSE SAFELY
    ======================================================== */

    const authText =
      await authResponse.text();

    let authData: any = {};

    if (authText.trim()) {
      try {
        authData =
          JSON.parse(
            authText
          );
      } catch {
        throw new Error(
          "Supabase Auth returned invalid JSON."
        );
      }
    }

    /* ========================================================
       AUTH ERROR
    ======================================================== */

    if (!authResponse.ok) {
      console.error(
        "AUTH CREATE ERROR:",
        authData
      );

      return NextResponse.json(
        {
          success: false,

          message:
            authData?.msg ||
            authData?.message ||
            authData?.error_description ||
            "Failed to create Auth user.",
        },
        { status: 400 }
      );
    }

    /* ========================================================
       AUTH USER ID
    ======================================================== */

    const authUser =
      authData?.user ||
      authData;

    createdAuthUserId =
      authUser?.id || null;

    if (!createdAuthUserId) {
      throw new Error(
        "Auth user was created but user ID was not returned."
      );
    }

    /* ========================================================
       WAIT BRIEFLY FOR DATABASE TRIGGER

       handle_new_user() should create the profile
       automatically after Auth user creation.
    ======================================================== */

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          300
        )
    );

    /* ========================================================
       UPDATE EXISTING PROFILE

       IMPORTANT:
       PATCH, NOT POST.

       The trigger already created this profile.
    ======================================================== */

    const profileUpdate = {
      full_name:
        fullName,

      email,

      phone:
        phone || null,

      role,

      status,

      username,

      employee_id:
        employeeId,

      employee_number:
        employeeNumber,

      can_send_messages:
        canSend,

      can_receive_messages:
        canReceive,

      // Each Channel Partner gets a unique code so their submission link
      // and dashboard are their own — employeeId is already guaranteed
      // unique, so it doubles as the partner code with no extra input.
      partner_code:
        role === "Channel Partner"
          ? employeeId
          : null,
    };

    const profileResponse =
      await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
          createdAuthUserId
        )}`,
        {
          method: "PATCH",

          headers: {
            apikey: serviceKey,

            Authorization:
              `Bearer ${serviceKey}`,

            "Content-Type":
              "application/json",

            Prefer:
              "return=representation",
          },

          body:
            JSON.stringify(
              profileUpdate
            ),
        }
      );

    const profileText =
      await profileResponse.text();

    let profileData: any[] = [];

    if (profileText.trim()) {
      try {
        profileData =
          JSON.parse(
            profileText
          );
      } catch {
        throw new Error(
          "Profile update returned invalid JSON."
        );
      }
    }

    /* ========================================================
       PROFILE UPDATE ERROR
    ======================================================== */

    if (!profileResponse.ok) {
      console.error(
        "PROFILE UPDATE ERROR:",
        profileData
      );

      /* Delete Auth user because profile update failed */

      await fetch(
        `${supabaseUrl}/auth/v1/admin/users/${createdAuthUserId}`,
        {
          method: "DELETE",

          headers: {
            apikey: serviceKey,

            Authorization:
              `Bearer ${serviceKey}`,
          },
        }
      );

      createdAuthUserId =
        null;

      return NextResponse.json(
        {
          success: false,

          message:
            profileData?.[0]?.message ||
            "Profile update failed.",

          error:
            profileData,
        },
        { status: 400 }
      );
    }

    /* ========================================================
       VERIFY PROFILE EXISTS
    ======================================================== */

    if (
      !Array.isArray(
        profileData
      ) ||
      profileData.length === 0
    ) {
      console.warn(
        "⚠️ Profile update returned no profile."
      );

      /* Try to read the profile */

      const verifyResponse =
        await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
            createdAuthUserId
          )}&select=*`,
          {
            method: "GET",

            headers: {
              apikey: serviceKey,

              Authorization:
                `Bearer ${serviceKey}`,
            },
          }
        );

      const verifyText =
        await verifyResponse.text();

      let verifyData: any[] = [];

      if (verifyText.trim()) {
        try {
          verifyData =
            JSON.parse(
              verifyText
            );
        } catch {
          verifyData = [];
        }
      }

      if (
        !Array.isArray(
          verifyData
        ) ||
        verifyData.length === 0
      ) {
        /* Cleanup Auth user */

        await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${createdAuthUserId}`,
          {
            method: "DELETE",

            headers: {
              apikey: serviceKey,

              Authorization:
                `Bearer ${serviceKey}`,
            },
          }
        );

        createdAuthUserId =
          null;

        return NextResponse.json(
          {
            success: false,

            message:
              "Auth user was created but the automatic profile was not found.",
          },
          { status: 400 }
        );
      }

      profileData =
        verifyData;
    }

    /* ========================================================
       SUCCESS
    ======================================================== */

    console.log(
      "========================================"
    );

    console.log(
      "✅ USER CREATED SUCCESSFULLY"
    );

    console.log(
      "Role:",
      role
    );

    console.log(
      "Employee ID:",
      employeeId
    );

    console.log(
      "Employee Number:",
      employeeNumber
    );

    console.log(
      "Username:",
      username
    );

    console.log(
      "Auth ID:",
      createdAuthUserId
    );

    console.log(
      "========================================"
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "User created successfully.",

        id:
          createdAuthUserId,

        employee_id:
          employeeId,

        employee_number:
          employeeNumber,

        username,

        email,

        password,

        role,

        status,

        data:
          profileData,
      },
      { status: 201 }
    );

  } catch (err: any) {
    /* ========================================================
       ERROR
    ======================================================== */

    console.error(
      "🔥 CREATE USER ERROR:",
      err
    );

    /* ========================================================
       CLEANUP AUTH USER
    ======================================================== */

    if (
      createdAuthUserId
    ) {
      try {
        const supabaseUrl =
          process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

        const serviceKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

        if (
          supabaseUrl &&
          serviceKey
        ) {
          await fetch(
            `${supabaseUrl}/auth/v1/admin/users/${createdAuthUserId}`,
            {
              method: "DELETE",

              headers: {
                apikey:
                  serviceKey,

                Authorization:
                  `Bearer ${serviceKey}`,
              },
            }
          );
        }
      } catch (
        cleanupError
      ) {
        console.error(
          "⚠️ AUTH CLEANUP ERROR:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,

        message:
          err?.message ||
          "Server error while creating user.",
      },
      { status: 500 }
    );
  }
}