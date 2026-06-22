"use client";

import { useHotspots, useRiskScores } from "@/hooks/use-api";
import { HotspotList } from "@/components/hotspots/hotspot-list";
import { RiskZoneCard } from "@/components/hotspots/risk-zone-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

export default function HotspotsPage() {
  const { data: hotspotsData, isLoading: hotspotsLoading } = useHotspots();
  const { data: riskData, isLoading: riskLoading } = useRiskScores(
    12.8, 77.4, 13.2, 77.8
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Hotspot Analytics</h2>
        <p className="text-sm text-muted-foreground">
          AI-detected crime hotspots and risk zones
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Flame className="h-4 w-4 text-accent" />
                Detected Hotspots ({hotspotsData?.items?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <HotspotList
                hotspots={hotspotsData?.items}
                loading={hotspotsLoading}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <RiskZoneCard
            riskScores={riskData?.grid}
            loading={riskLoading}
          />

          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total hotspots</span>
                <span className="font-medium">{hotspotsData?.items?.length ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Highest risk</span>
                <span className="font-medium">
                  {hotspotsData?.items?.length
                    ? [...hotspotsData.items].sort(
                        (a, b) =>
                          ["low", "moderate", "high", "critical"].indexOf(b.risk_level) -
                          ["low", "moderate", "high", "critical"].indexOf(a.risk_level)
                      )[0]?.risk_level
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg radius</span>
                <span className="font-medium">
                  {hotspotsData?.items?.length
                    ? Math.round(
                        hotspotsData.items.reduce((s, h) => s + h.radius_meters, 0) /
                          hotspotsData.items.length
                      )
                    : "—"}{" "}
                  m
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
