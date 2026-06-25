"use client";

import { useIncidents, useHotspots, useRiskScores } from "@/hooks/use-api";
import { MapView } from "@/components/map/map-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

export default function SafetyMapPage() {
  const { data: incidents, isLoading: incidentsLoading, isError: incidentsError } = useIncidents({ per_page: 500 });
  const { data: hotspots, isLoading: hotspotsLoading, isError: hotspotsError } = useHotspots();
  const { data: riskScores, isLoading: riskLoading, isError: riskError } = useRiskScores(
    12.8, 77.4, 13.2, 77.8
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Safety Map</h2>
        <p className="text-sm text-muted-foreground">
          Interactive crime map with incident markers, hotspot zones, and risk heatmap
        </p>
      </div>

      {(incidentsError || hotspotsError || riskError) && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load map data. Please try again later.
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Layers</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="hotspots">Hotspots</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <MapView
            incidents={incidents?.items}
            hotspots={hotspots?.items}
            riskScores={riskScores?.grid}
            loading={incidentsLoading || hotspotsLoading || riskLoading}
          />
        </TabsContent>

        <TabsContent value="incidents" className="mt-4">
          <MapView
            incidents={incidents?.items}
            loading={incidentsLoading}
          />
        </TabsContent>

        <TabsContent value="hotspots" className="mt-4">
          <MapView
            hotspots={hotspots?.items}
            riskScores={riskScores?.grid}
            loading={hotspotsLoading || riskLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
