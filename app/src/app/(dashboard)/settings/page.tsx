import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { TeamManager } from "@/components/team-manager";
import { NotificationSettings } from "@/components/notification-settings";
import { AuditLog } from "@/components/audit-log";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/sign-in");

  const isAdmin = session.user.role === "admin";
  const isComplianceOfficer = session.user.role === "compliance_officer";

  if (!isAdmin && !isComplianceOfficer) redirect("/dashboard");

  const [users, org, auditEntries] = await Promise.all([
    isAdmin
      ? db.user.findMany({
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
        })
      : Promise.resolve([]),
    db.organization.findUnique({
      where: { id: session.user.orgId },
      select: { name: true, alertAt72h: true, alertAt24h: true, alertOnOverdue: true },
    }),
    db.incidentTimeline.findMany({
      where: { incident: { orgId: session.user.orgId } },
      include: {
        creator: { select: { name: true, email: true } },
        incident: { select: { title: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
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

      <div className="space-y-6">
        <NotificationSettings
          alertAt72h={org?.alertAt72h ?? true}
          alertAt24h={org?.alertAt24h ?? true}
          alertOnOverdue={org?.alertOnOverdue ?? true}
        />

        {isAdmin && (
          <TeamManager
            users={users.map((u) => ({
              ...u,
              emailVerified: u.emailVerified?.toISOString() || null,
              createdAt: u.createdAt.toISOString(),
            }))}
            currentUserId={session.user.id}
          />
        )}

        <AuditLog
          entries={auditEntries.map((e) => ({
            id: e.id,
            eventType: e.eventType,
            description: e.description,
            createdAt: e.createdAt.toISOString(),
            creatorName: e.creator?.name || e.creator?.email || "System",
            incidentTitle: e.incident?.title,
            incidentId: e.incident?.id,
          }))}
        />
      </div>
    </div>
  );
}
