import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

// Minimal config safe for Edge runtime (no DB/Prisma imports).
// Used by middleware to decrypt the JWT and read session fields.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/sign-in",
    newUser: "/onboarding",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // Full authorize logic is in auth.ts — this config is Edge-only
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.userId as string;
        session.user.orgId = (token.orgId as string) || null;
        session.user.role = (token.role as string) || "viewer";
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
