"use client";

import { useIncidents, useHotspots, useRiskScores } from "@/hooks/use-api";
import { MapView } from "@/components/map/map-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SafetyMapPage() {
  const { data: incidents, isLoading: incidentsLoading } = useIncidents({ per_page: 500 });
  const { data: hotspots, isLoading: hotspotsLoading } = useHotspots();
  const { data: riskScores, isLoading: riskLoading } = useRiskScores(
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
