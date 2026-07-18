import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      full_name,
      email,
      role,
      status,
    } = body;

    // Generate password
    const password =
      `FC#${Math.random().toString(36).slice(-8)}A1`;

    // Check existing email
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already exists.",
        },
        { status: 400 }
      );
    }

    // Employee number
    const { data: number, error: seqError } =
      await admin.rpc("get_next_employee_number");

    if (seqError) {
      return NextResponse.json(
        {
          success: false,
          message: seqError.message,
        },
        { status: 400 }
      );
    }

    let prefix = "AGT";

    if (role === "Closer") prefix = "CLR";
    if (role === "Supervisor") prefix = "SUP";
    if (role === "Admin") prefix = "ADM";

    const employee_id =
      `FCS-${prefix}-${String(number).padStart(3, "0")}`;

    // Username generation
    const names = full_name
      .trim()
      .toLowerCase()
      .split(" ");

    let username =
      names.length > 1
        ? `${names[0]}.${names[1][0]}`
        : names[0];

    let counter = 1;

    while (true) {
      const { data } = await admin
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (!data) break;

      username =
        names.length > 1
          ? `${names[0]}.${names[1][0]}${String(counter).padStart(2, "0")}`
          : `${names[0]}${String(counter).padStart(2, "0")}`;

      counter++;
    }

    // Create Auth user only.
    // The trigger creates the profile.
    const { error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
          status,
          employee_number: number,
          employee_id,
          username,
        },
      });

    if (authError) {
      return NextResponse.json(
        {
          success: false,
          message: authError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      employee_id,
      username,
      password,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }
}