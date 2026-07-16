import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Force Node.js runtime instead of Edge (Prisma requires Node.js)
export const runtime = 'nodejs';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes that don't require authentication
  // Removed /debug from public routes - any debug pages require authentication
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthApi = pathname.startsWith("/api/auth");

  if (isPublicRoute || isAuthApi) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
