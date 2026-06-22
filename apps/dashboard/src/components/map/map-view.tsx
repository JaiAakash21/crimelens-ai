"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Hotspot, Incident, RiskScore } from "@/types";

interface MapViewProps {
  incidents?: Incident[];
  hotspots?: Hotspot[];
  riskScores?: RiskScore[];
  loading?: boolean;
  center?: [number, number];
  zoom?: number;
}

export function MapView({
  incidents,
  hotspots,
  riskScores,
  loading,
  center = [12.9716, 77.5946],
  zoom = 12,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (loading || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      const map = L.map(mapRef.current!, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      leafletRef.current = L;
      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading]);

  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return;

    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const icon = L.divIcon({
      className: "w-3 h-3 rounded-full bg-accent border-2 border-white shadow",
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    incidents?.forEach((inc) => {
      const marker = L.marker([inc.lat, inc.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<b>${inc.title}</b><br/>${inc.incident_type.replace(/_/g, " ")}<br/>${new Date(inc.occurred_at).toLocaleDateString()}`
        );
      markersRef.current.push(marker);
    });

    hotspots?.forEach((hs) => {
      const color =
        hs.risk_level === "critical"
          ? "#ef4444"
          : hs.risk_level === "high"
            ? "#f97316"
            : hs.risk_level === "moderate"
              ? "#f59e0b"
              : "#22c55e";

      const circle = L.circle([hs.center_lat, hs.center_lng], {
        radius: hs.radius_meters,
        color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(
          `<b>Hotspot #${hs.cluster_id}</b><br/>Risk: ${hs.risk_level}<br/>Incidents: ${hs.point_count}`
        );
      markersRef.current.push(circle);
    });
  }, [incidents, hotspots]);

  if (loading) {
    return <Skeleton className="h-[500px] w-full rounded-xl" />;
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div ref={mapRef} className="h-[500px] w-full" />
      </CardContent>
    </Card>
  );
}
