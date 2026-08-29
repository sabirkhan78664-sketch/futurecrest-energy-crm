import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/admin";

/*
|--------------------------------------------------------------------------
| IP-RESTRICTED ROLE GATING
|--------------------------------------------------------------------------
| Super Admin and Channel Partner may sign in from anywhere. Admin, Agent,
| Closer and QA are restricted to the office IP range — this reflects the
| fact that partner staff and top-level admins legitimately work off-site,
| while day-to-day operational roles are expected to work from the office.
|
| NOTE: This is `proxy.ts`, not `middleware.ts` — Next.js 16 renamed the
| middleware file convention to Proxy (`export function proxy`, project
| root, defaults to the Node.js runtime). Setting `export const runtime`
| here is invalid and throws — Proxy no longer supports overriding it.
|--------------------------------------------------------------------------
*/

const OFFICE_IP_START = ipToInt("36.255.66.74");
const OFFICE_IP_END = ipToInt("36.255.66.78");

const PUBLIC_PATHS = [
  "/login",
  "/submit", // public partner intake form
  "/auth", // /auth/update-password
  "/unauthorized", // avoid redirect loop
  "/api", // every API route enforces its own auth internally, and the
  // public partner form (/submit) posts to /api/partner/submit
  // with no session at all — this must never be gated here.
  "/_next", // Next.js internals
  "/favicon.ico",
  "/public",
  "/manifest.json", // PWA manifest — fetched unauthenticated by the browser
  "/sw.js", // service worker — must be reachable with no session too
];

const OFFICE_ONLY_ROLES = ["Admin", "Agent", "Closer", "QA"];
const UNRESTRICTED_ROLES = ["Super Admin", "Channel Partner"];

function ipToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  );
}

function isOfficeIP(ip: string): boolean {
  if (ip === "127.0.0.1" || ip === "::1") {
    return true;
  }

  if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return false;
  }

  const value = ipToInt(ip);
  return value >= OFFICE_IP_START && value <= OFFICE_IP_END;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // No reverse proxy in front of the request (local dev) — treat as
  // localhost rather than "unknown" so `next dev` keeps working.
  return "127.0.0.1";
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },

        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          response.cookies.set({
            name,
            value,
            ...options,
          });
        },

        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Service-role lookup — not subject to RLS, and reliable from Proxy
  // context regardless of what policies exist on `profiles`.
  const { data: profile, error } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (UNRESTRICTED_ROLES.includes(profile.role)) {
    return response;
  }

  if (OFFICE_ONLY_ROLES.includes(profile.role)) {
    const ip = getClientIP(request);

    if (!isOfficeIP(ip)) {
      return NextResponse.redirect(
        new URL("/unauthorized?reason=ip", request.url)
      );
    }

    return response;
  }

  // Unrecognised role — deny by default rather than silently allow.
  return NextResponse.redirect(new URL("/unauthorized", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
