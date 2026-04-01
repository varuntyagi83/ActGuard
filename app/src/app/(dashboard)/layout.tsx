import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (!session.user.orgId) {
    redirect("/onboarding");
  }

  const org = await db.organization.findUnique({
    where: { id: session.user.orgId },
    select: { name: true },
  });

  return (
    <div className="flex h-screen">
      <Sidebar user={session.user} orgName={org?.name || "My Organisation"} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
}
