import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/", "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"];
const authRoutes = ["/sign-in", "/sign-up"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  const hasOrg = !!token?.orgId;

  // Allow public routes for unauthenticated users
  if (publicRoutes.includes(pathname)) {
    // Redirect logged-in users away from auth pages
    if (isLoggedIn && authRoutes.includes(pathname)) {
      return NextResponse.redirect(
        new URL(hasOrg ? "/dashboard" : "/onboarding", req.nextUrl)
      );
    }
    return NextResponse.next();
  }

  // Unauthenticated users → sign-in
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
  }

  // Authenticated but no org → onboarding (except onboarding itself)
  if (!hasOrg && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl));
  }

  // Onboarding page when user already has org → dashboard
  if (hasOrg && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
