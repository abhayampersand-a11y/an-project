import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In Next.js 16, Middleware is called "Proxy". Same functionality.
// This runs before requests to gate the dashboard behind the session cookie.
const SESSION_COOKIE = "dash_session";
const AUTH_SECRET = process.env.AUTH_SECRET ?? "dev-only-secret-change-me";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed =
    request.cookies.get(SESSION_COOKIE)?.value === AUTH_SECRET;

  // Block the dashboard for unauthenticated users.
  if (pathname.startsWith("/dashboard") && !isAuthed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If already logged in, skip the login page.
  if (pathname === "/login" && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
