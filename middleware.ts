import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = getSessionCookie(request, {
    cookieName: "session_token",
    cookiePrefix: "better-auth",
    useSecureCookies: false,
  });
  if (!sessionCookie) {
    //If the user is not logged in, then deny access to all protected routes.
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    //if the user is not logged in, deny access to the api/get/user endpoint.
    if (pathname.startsWith("/api/get/user/")) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/get/user/")) {
    return NextResponse.next();
  }

  // Continue for other routes
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/get/user/:path*", "/dashboard/:path*"],
};
