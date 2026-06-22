import React from "react";
import MapView, { Marker, UrlTile, Region, Circle, MapPressEvent } from "react-native-maps";
import { StyleSheet, ViewStyle } from "react-native";
import { colors, BANGALORE_DEFAULT_REGION } from "../../constants";
import { Incident, Hotspot } from "../../types";
import { IncidentMarker } from "./IncidentMarker";
import { HotspotLayer } from "./HotspotLayer";

interface SafetyMapProps {
  incidents?: Incident[];
  hotspots?: Hotspot[];
  onPress?: (e: MapPressEvent) => void;
  onMarkerPress?: (incident: Incident) => void;
  initialRegion?: Region;
  style?: ViewStyle;
  showsUserLocation?: boolean;
}

export function SafetyMap({
  incidents = [],
  hotspots = [],
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
