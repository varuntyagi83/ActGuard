import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      orgId: string | null;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    orgId: string | null;
    role: string;
  }
}
