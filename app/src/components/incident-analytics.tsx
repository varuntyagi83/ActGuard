"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  major: "#ea580c",
  minor: "#ca8a04",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  reported: "#2563eb",
  investigating: "#7c3aed",
  resolved: "#16a34a",
  closed: "#9ca3af",
};

interface Props {
  severityCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  avgResponseHours: number | null;
  overdueCount: number;
  totalCount: number;
}

export function IncidentAnalytics({
  severityCounts,
  statusCounts,
  avgResponseHours,
  overdueCount,
  totalCount,
}: Props) {
  const severityData = Object.entries(severityCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: SEVERITY_COLORS[name] || "#6b7280",
  }));

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count: value,
    fill: STATUS_COLORS[name] || "#6b7280",
  }));

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Incidents
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {avgResponseHours !== null
                ? `${avgResponseHours.toFixed(1)}h`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: under 24h
            </p>
          </CardContent>
        </Card>

        <Card className={overdueCount > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${overdueCount > 0 ? "text-red-700 dark:text-red-300" : ""}`}>
              {overdueCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Past 24h deadline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Severity</CardTitle>
          </CardHeader>
          <CardContent>
            {severityData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No incidents yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {severityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No incidents yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Incidents">
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
