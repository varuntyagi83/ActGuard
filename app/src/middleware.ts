import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/", "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"];
const authRoutes = ["/sign-in", "/sign-up"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session?.user;
  const hasOrg = !!session?.user?.orgId;

  if (publicRoutes.includes(pathname)) {
    if (isLoggedIn && authRoutes.includes(pathname)) {
      return NextResponse.redirect(
        new URL(hasOrg ? "/dashboard" : "/onboarding", req.nextUrl)
      );
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
  }

  if (!hasOrg && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl));
  }

  if (hasOrg && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
