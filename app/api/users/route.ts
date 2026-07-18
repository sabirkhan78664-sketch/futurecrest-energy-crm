import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Getting the variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("🔥 MISSING KEYS!");
      return NextResponse.json({ success: false, message: 'Missing keys' }, { status: 500 });
    }

    console.log(`Sending request to: ${supabaseUrl}/auth/v1/admin/users`);

    // BYPASSING THE SUPABASE LIBRARY WITH A RAW FETCH
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name,
          phone: body.phone,
          role: body.role,
          status: body.status,
        }
      })
    });

    const data = await response.json();

    // If Supabase rejects it, it will print the EXACT reason here
    if (!response.ok) {
      console.error("🔥 REAL DATABASE ERROR:", data);
      return NextResponse.json({ success: false, error: data }, { status: 400 });
    }

    console.log("✅ USER CREATED SUCCESSFULLY:", data.email);
    return NextResponse.json({ success: true, data });

  } catch (err: any) {
    console.error("🔥 SERVER CRASH ERROR:", err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}