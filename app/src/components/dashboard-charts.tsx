"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText } from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  unacceptable: "#dc2626",
  high: "#ea580c",
  limited: "#ca8a04",
  minimal: "#16a34a",
  unclassified: "#6b7280",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  technical_doc: "Technical",
  risk_management_plan: "Risk Plan",
  data_governance: "Data Gov.",
  conformity_assessment: "Conformity",
  transparency_info: "Transparency",
  human_oversight_plan: "Oversight",
};

interface Props {
  riskTierCounts: Record<string, number>;
  docTypeCounts: Record<string, number>;
  systemCount: number;
}

export function DashboardCharts({
  riskTierCounts,
  docTypeCounts,
  systemCount,
}: Props) {
  const pieData = Object.entries(riskTierCounts).map(([tier, count]) => ({
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    value: count,
    color: RISK_COLORS[tier] || RISK_COLORS.unclassified,
  }));

  // For each doc type, show how many systems have at least one doc of that type
  // vs total systems — shows compliance coverage
  const barData = Object.entries(DOC_TYPE_LABELS).map(([type, label]) => ({
    name: label,
    generated: docTypeCounts[type] || 0,
    remaining: Math.max(0, systemCount - (docTypeCounts[type] || 0)),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Risk Tier Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Risk Tier Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No AI systems registered yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Document Coverage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {systemCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              No AI systems registered yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="generated"
                  name="Generated"
                  stackId="a"
                  fill="#2563eb"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="remaining"
                  name="Remaining"
                  stackId="a"
                  fill="#e5e7eb"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
