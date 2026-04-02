import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
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
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: { id: true, orgId: true, role: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.orgId = dbUser.orgId;
          token.role = dbUser.role;
        }
      }

      // Re-fetch orgId on every request if it's still null
      // This handles the case where org is created after sign-in
      if (!token.orgId && token.userId) {
        const dbUser = await db.user.findUnique({
          where: { id: token.userId as string },
          select: { orgId: true, role: true },
        });
        if (dbUser?.orgId) {
          token.orgId = dbUser.orgId;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.orgId = token.orgId as string | null;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
});
