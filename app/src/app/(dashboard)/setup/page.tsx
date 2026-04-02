import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function OnboardingPage() {
  const session = await auth();
  const orgId = session!.user.orgId!;

  const systems = await db.aiSystem.findMany({
    where: { orgId },
    select: { id: true, name: true, riskTier: true },
    orderBy: { createdAt: "asc" },
  });

  // If already fully set up (has systems and all classified), redirect to dashboard
  const allClassified =
    systems.length > 0 &&
    systems.every((s) => s.riskTier !== "unclassified");

  if (allClassified) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Getting started
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Follow these steps to set up your EU AI Act compliance programme.
        </p>
      </div>

      <OnboardingWizard systems={systems} />
    </div>
  );
}
