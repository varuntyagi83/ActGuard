import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Role hierarchy: admin > compliance_officer > viewer
const ROLE_LEVELS: Record<string, number> = {
  viewer: 1,
  compliance_officer: 2,
  admin: 3,
};

export type Role = "viewer" | "compliance_officer" | "admin";

/**
 * Check if user has at least the required role level.
 * Returns the session if authorized, or a NextResponse error.
 */
export async function requireRole(minRole: Role) {
  const session = await auth();

  if (!session?.user?.orgId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userLevel = ROLE_LEVELS[session.user.role] || 0;
  const requiredLevel = ROLE_LEVELS[minRole] || 0;

  if (userLevel < requiredLevel) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: insufficient permissions" },
        { status: 403 }
      ),
    };
  }

  return { session };
}
