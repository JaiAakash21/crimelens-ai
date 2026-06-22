"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getRiskColor } from "@/lib/utils";
import type { RiskScore } from "@/types";
import { ShieldAlert } from "lucide-react";

interface RiskZoneCardProps {
  riskScores?: RiskScore[];
  loading?: boolean;
}

export function RiskZoneCard({ riskScores, loading }: RiskZoneCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const levels = [
    { key: "critical", label: "Critical", min: 80 },
    { key: "high", label: "High", min: 60 },
    { key: "moderate", label: "Moderate", min: 40 },
    { key: "low", label: "Low", min: 0 },
  ];

  const counts = levels.map((level) => ({
    ...level,
    count: riskScores?.filter((r) => {
      if (level.key === "critical") return r.score >= 80;
      if (level.key === "high") return r.score >= 60 && r.score < 80;
      if (level.key === "moderate") return r.score >= 40 && r.score < 60;
      return r.score < 40;
    }).length ?? 0,
  }));

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-accent" />
          <h3 className="text-sm font-semibold">Risk Zone Distribution</h3>
        </div>

        <div className="space-y-3">
          {counts.map((level) => (
            <div key={level.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: getRiskColor(level.key) }}>
                  {level.label}
                </span>
                <span className="text-muted-foreground">{level.count} zones</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all")}
                  style={{
                    width: `${Math.min(100, (level.count / Math.max(1, riskScores?.length ?? 1)) * 100)}%`,
                    backgroundColor: getRiskColor(level.key),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
