import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Agent-to-Agent lead assignment is disabled. Agents own the leads they submit; Admin/Super Admin assign Closers only.",
    },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      message: "Agent-to-Agent lead assignment is disabled.",
    },
    { status: 403 }
  );
}
