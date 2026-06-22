"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn, getRiskColor } from "@/lib/utils";
import type { Hotspot } from "@/types";
import { Flame, MapPin, Users } from "lucide-react";

interface HotspotListProps {
  hotspots?: Hotspot[];
  loading?: boolean;
  onFocus?: (hotspot: Hotspot) => void;
}

const riskStyles: Record<string, string> = {
  low: "border-l-green-500",
  moderate: "border-l-yellow-500",
  high: "border-l-orange-500",
  critical: "border-l-red-500",
};

export function HotspotList({ hotspots, loading, onFocus }: HotspotListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(!hotspots || hotspots.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Flame className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No active hotspots</p>
          </CardContent>
        </Card>
      )}
      {hotspots?.map((hotspot) => (
        <Card
          key={hotspot.id}
          className={cn("border-l-4", riskStyles[hotspot.risk_level] ?? "border-l-gray-500")}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    Hotspot #{hotspot.cluster_id}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[11px]"
                    style={{ color: getRiskColor(hotspot.risk_level) }}
                  >
                    {hotspot.risk_level.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {hotspot.center_lat.toFixed(4)}, {hotspot.center_lng.toFixed(4)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {hotspot.point_count} incidents
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {hotspot.incident_types?.map((type) => (
                    <Badge key={type} variant="secondary" className="text-[10px]">
                      {type.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onFocus?.(hotspot)}
              >
                Focus
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
