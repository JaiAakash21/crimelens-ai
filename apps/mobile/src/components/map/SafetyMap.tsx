import React from "react";
import MapView, { Marker, UrlTile, Region, Circle, MapPressEvent } from "react-native-maps";
import { StyleSheet, ViewStyle } from "react-native";
import { colors, BANGALORE_DEFAULT_REGION } from "../../constants";
import { Incident, Hotspot, RiskScore } from "../../types";
import { IncidentMarker } from "./IncidentMarker";
import { HotspotLayer } from "./HotspotLayer";
import { RiskScoreLayer } from "./RiskScoreLayer";

interface SafetyMapProps {
  incidents?: Incident[];
  hotspots?: Hotspot[];
  riskScores?: RiskScore[];
  onPress?: (e: MapPressEvent) => void;
  onMarkerPress?: (incident: Incident) => void;
  initialRegion?: Region;
  style?: ViewStyle;
  showsUserLocation?: boolean;
}

export function SafetyMap({
  incidents = [],
  hotspots = [],
  riskScores = [],
  onPress,
  onMarkerPress,
  initialRegion = BANGALORE_DEFAULT_REGION,
  style,
  showsUserLocation = true,
}: SafetyMapProps) {
  return (
    <MapView
      style={[styles.map, style]}
      initialRegion={initialRegion}
      onPress={onPress}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={true}
    >
      <UrlTile
        urlTemplate="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        maximumZ={19}
        flipY={false}
      />

      <HotspotLayer hotspots={hotspots} />
      <RiskScoreLayer scores={riskScores} />

      {incidents.map((incident) => (
        <IncidentMarker
          key={incident.id}
          incident={incident}
          onPress={() => onMarkerPress?.(incident)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
