"use client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Skeleton } from "@/components/ui/skeleton";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Incident, Hotspot, RiskScore } from "@/types";

interface MapViewProps {
  incidents?: Incident[];
  hotspots?: Hotspot[];
  riskScores?: RiskScore[];
  loading?: boolean;
  center?: [number, number];
  zoom?: number;
}

const markerIcon = new L.DivIcon({
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  html: `<div style="width:12px;height:12px;border-radius:50%;background:#6366f1;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
});

function getHotspotColor(riskLevel: string) {
  switch (riskLevel) {
    case "critical": return "#ef4444";
    case "high": return "#f97316";
    case "moderate": return "#f59e0b";
    default: return "#22c55e";
  }
}

function MapEvents() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
    const container = map.getContainer();
    const stopWheel = (e: WheelEvent) => e.stopPropagation();
    container.addEventListener("wheel", stopWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", stopWheel);
    };
  }, [map]);
  return null;
}

function MapLayers({
  incidents,
  hotspots,
}: {
  incidents?: Incident[];
  hotspots?: Hotspot[];
}) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);
  const circlesRef = useRef<L.Circle[]>([]);

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (incidents) {
      incidents.forEach((inc) => {
        const marker = L.marker([inc.lat, inc.lng], { icon: markerIcon })
          .bindPopup(
            `<b>${inc.title}</b><br />${inc.incident_type.replace(/_/g, " ")}<br />${new Date(inc.occurred_at).toLocaleDateString()}`
          );
        marker.addTo(map);
        markersRef.current.push(marker);
      });
    }

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, incidents]);

  useEffect(() => {
    circlesRef.current.forEach((c) => c.remove());
    circlesRef.current = [];

    if (hotspots) {
      hotspots.forEach((hs) => {
        const color = getHotspotColor(hs.risk_level);
        const circle = L.circle([hs.center_lat, hs.center_lng], {
          radius: hs.radius_meters,
          color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
        }).bindPopup(
          `<b>Hotspot #${hs.cluster_id}</b><br />Risk: ${hs.risk_level}<br />Incidents: ${hs.point_count}`
        );
        circle.addTo(map);
        circlesRef.current.push(circle);
      });
    }

    return () => {
      circlesRef.current.forEach((c) => c.remove());
      circlesRef.current = [];
    };
  }, [map, hotspots]);

  return null;
}

export function MapView({
  incidents,
  hotspots,
  loading,
  center = [12.9716, 77.5946],
  zoom = 12,
}: MapViewProps) {
  if (loading) {
    return <Skeleton className="h-[500px] w-full rounded-xl" />;
  }

  return (
    <div
      className="rounded-xl border bg-card shadow"
      style={{ height: "500px", position: "relative", zIndex: 0 }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full rounded-xl"
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <MapEvents />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapLayers incidents={incidents} hotspots={hotspots} />
      </MapContainer>
    </div>
  );
}
