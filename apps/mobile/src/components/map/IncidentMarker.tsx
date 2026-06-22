import React from "react";
import { Marker, Callout } from "react-native-maps";
import { View, Text, StyleSheet } from "react-native";
import { Incident } from "../../types";
import { colors } from "../../constants";

const TYPE_COLORS: Record<string, string> = {
  theft: colors.typeTheft,
  robbery: colors.typeRobbery,
  harassment: colors.typeHarassment,
  assault: colors.typeAssault,
  suspicious_activity: colors.typeSuspicious,
  vandalism: colors.typeVandalism,
  other: colors.typeOther,
};

interface IncidentMarkerProps {
  incident: Incident;
  onPress?: () => void;
}

export function IncidentMarker({ incident, onPress }: IncidentMarkerProps) {
  const markerColor = TYPE_COLORS[incident.incident_type] ?? colors.typeOther;

  return (
    <Marker
      coordinate={{
        latitude: incident.lat,
        longitude: incident.lng,
      }}
      onPress={onPress}
      pinColor={markerColor}
    >
      <Callout>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{incident.title}</Text>
          <Text style={[styles.calloutType, { color: markerColor }]}>
            {incident.incident_type.replace("_", " ")}
          </Text>
          <Text style={styles.calloutDesc} numberOfLines={2}>
            {incident.description}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  callout: {
    width: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  calloutType: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  calloutDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
