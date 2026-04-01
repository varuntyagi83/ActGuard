import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TeamManager } from "@/components/team-manager";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/sign-in");

  // Only admins can access settings
  if (session.user.role !== "admin") redirect("/dashboard");

  const [users, org] = await Promise.all([
    db.user.findMany({
      where: { orgId: session.user.orgId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.organization.findUnique({
      where: { id: session.user.orgId },
      select: { name: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your team and organisation for {org?.name}.
        </p>
      </div>

      <TeamManager
        users={users.map((u) => ({
          ...u,
          emailVerified: u.emailVerified?.toISOString() || null,
          createdAt: u.createdAt.toISOString(),
        }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
