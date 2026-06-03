import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/explore",
  "/contact",
  "/terms-of-service",
  "/privacy-policy",
  "/chat",
];

const protectedRoutes = [
  "/profile",
  "/profile/edit",
  "/referrals",
];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(route + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip Next.js internals and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Public routes
  if (
    publicRoutes.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // Protected routes
  if (isProtectedRoute(pathname)) {
    const token =
      request.cookies.get("accessToken")?.value;

    if (!token) {
      const loginUrl = new URL(
        "/login",
        request.url
      );

      loginUrl.searchParams.set(
        "from",
        pathname
      );

      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};