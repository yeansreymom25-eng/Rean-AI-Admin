import { NextResponse, type NextRequest } from "next/server";

const protectedPaths = [
  "/admin_dashboard",
  "/students",
  "/settings",
  "/content",
  "/topics",
  "/subjects",
  "/grade_levels",
  "/curriculum_versions",
  "/ai_reviews",
];

function loginRedirect(request: NextRequest): NextResponse {
  const url = new URL("/auth/Login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/**
 * Server-side gate for Admin pages.  Cookie presence alone is not authority:
 * the backend verifies signature, expiry, and Admin role before a protected
 * page is served.  Production must point BACKEND_INTERNAL_BASE_URL at the
 * same-origin BFF/reverse proxy used by browser API calls.
 */
export async function proxy(request: NextRequest) {
  if (!protectedPaths.some((path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  const cookie = request.headers.get("cookie");
  if (!cookie) return loginRedirect(request);

  const backendBaseUrl = process.env.BACKEND_INTERNAL_BASE_URL ??
    (process.env.NODE_ENV === "production" ? "" : "http://localhost:4000/api/v1");
  if (!backendBaseUrl) return loginRedirect(request);
  try {
    const response = await fetch(`${backendBaseUrl}/admin/auth/me`, {
      headers: { cookie, accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return loginRedirect(request);
  } catch {
    // Fail closed if the identity service is unavailable.
    return loginRedirect(request);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
