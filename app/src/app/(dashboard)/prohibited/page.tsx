import { Ban } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProhibitedChecker } from "@/components/prohibited-checker";

const ARTICLE_5_PRACTICES = [
  {
    id: 1,
    label: "Subliminal manipulation",
    description:
      "AI that deploys subliminal techniques beyond a person's conscious awareness to materially distort their behaviour in a way that causes or is likely to cause harm.",
  },
  {
    id: 2,
    label: "Exploiting vulnerabilities of specific groups",
    description:
      "AI that exploits vulnerabilities of specific persons due to their age, disability, or social or economic situation to distort their behaviour in a harmful way.",
  },
  {
    id: 3,
    label: "Social scoring by public authorities",
    description:
      "AI used by public authorities to evaluate or classify natural persons based on social behaviour or personal characteristics, leading to detrimental or disproportionate treatment.",
  },
  {
    id: 4,
    label: "Real-time remote biometric ID in public spaces",
    description:
      "Real-time remote biometric identification systems used in publicly accessible spaces for law enforcement purposes (subject to narrow exceptions under Article 5(2)).",
  },
  {
    id: 5,
    label: "Biometric categorisation inferring sensitive attributes",
    description:
      "Biometric categorisation systems that infer race, political opinions, trade union membership, religious beliefs, sex life, or sexual orientation from biometric data.",
  },
  {
    id: 6,
    label: "Emotion recognition in workplace or education",
    description:
      "AI systems used to infer the emotions of natural persons in workplace or educational settings, except for medical or safety-related purposes.",
  },
  {
    id: 7,
    label: "Untargeted facial image scraping",
    description:
      "Untargeted scraping of facial images from the internet or CCTV footage to create or expand facial recognition databases.",
  },
  {
    id: 8,
    label: "Predictive policing based solely on profiling",
    description:
      "AI used for risk assessments of individuals in order to predict criminal offences based solely on profiling or personality trait assessment.",
  },
];

export default async function ProhibitedPage() {
  const session = await auth();
  const orgId = session!.user.orgId!;

  const systems = await db.aiSystem.findMany({
    where: { orgId },
    select: { id: true, name: true, description: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Ban className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Prohibited Practices Checker
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Screen an AI system description against the 8 prohibited practices defined in{" "}
          <strong>Article 5 of the EU AI Act</strong>. Systems that fall under any of these
          categories are banned outright — no risk classification or compliance process applies.
        </p>
      </div>

      {/* Article 5 reference cards */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Article 5 — Prohibited Practices
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ARTICLE_5_PRACTICES.map((practice) => (
            <div
              key={practice.id}
              className="rounded-lg border bg-white dark:bg-gray-950 px-4 py-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 rounded px-1.5 py-0.5">
                  Art. 5({practice.id})
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {practice.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {practice.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive checker */}
      <ProhibitedChecker systems={systems} />
    </div>
  );
}
