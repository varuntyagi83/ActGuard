import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Plus, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";

const riskColors: Record<string, string> = {
  unacceptable: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  limited: "bg-yellow-100 text-yellow-800",
  minimal: "bg-green-100 text-green-800",
  unclassified: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  classified: "Classified",
  documenting: "Documenting",
  compliant: "Compliant",
  review_needed: "Review Needed",
};

export default async function SystemsPage() {
  const session = await auth();
  const orgId = session!.user.orgId!;

  const systems = await db.aiSystem.findMany({
    where: { orgId },
    include: {
      complianceDocuments: { select: { id: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Systems</h1>
          <p className="text-gray-600 mt-1">
            Register and manage your AI systems for EU AI Act compliance.
          </p>
        </div>
        <Link href="/systems/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Register AI System
          </Button>
        </Link>
      </div>

      {systems.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-950 rounded-xl border">
          <Cpu className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No AI systems yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Register your first AI system to start the risk classification and
            compliance documentation process.
          </p>
          <Link href="/systems/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Register your first AI system
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-950 rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Risk Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systems.map((system) => (
                <TableRow key={system.id}>
                  <TableCell>
                    <Link
                      href={`/systems/${system.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {system.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={riskColors[system.riskTier]}>
                      {system.riskTier.charAt(0).toUpperCase() +
                        system.riskTier.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {statusLabels[system.status] || system.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {system.complianceDocuments.length}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(system.updatedAt)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
