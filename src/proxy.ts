import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "fallback_secret_for_development";
const key = new TextEncoder().encode(secretKey);

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define paths that require admin authorization
  const isAdminPath = 
    path === "/admin" || 
    path.startsWith("/admin/") || 
    path === "/dashboard" || 
    path.startsWith("/dashboard/") || 
    path === "/analytics" || 
    path.startsWith("/analytics/") || 
    path === "/visitors" || 
    path.startsWith("/visitors/") ||
    (path.startsWith("/api/admin") && path !== "/api/admin/login");

  const isLoginPage = path === "/admin/login";

  if (isAdminPath && !isLoginPage) {
    const sessionCookie = request.cookies.get("admin_session")?.value;

    if (!sessionCookie) {
      // No session cookie, redirect to admin login
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify JWT token
      await jwtVerify(sessionCookie, key);
      return NextResponse.next();
    } catch (err) {
      // Invalid JWT token, redirect to admin login
      console.warn("Invalid admin session JWT:", err);
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", path);
      
      // Clear the invalid cookie
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set("admin_session", "", { expires: new Date(0), path: "/" });
      return response;
    }
  }

  // If already authenticated and trying to access the login page, redirect to dashboard
  if (isLoginPage) {
    const sessionCookie = request.cookies.get("admin_session")?.value;
    if (sessionCookie) {
      try {
        await jwtVerify(sessionCookie, key);
        return NextResponse.redirect(new URL("/admin", request.url));
      } catch (err) {
        // Carry on to login page if token is expired/invalid
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/analytics/:path*",
    "/visitors/:path*",
    "/api/admin/:path*",
  ],
};
