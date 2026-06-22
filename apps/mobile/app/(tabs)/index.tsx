import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { useIncidents } from "../../src/hooks/useIncidents";
import { useHotspots } from "../../src/hooks/useHotspots";
import { useLocation } from "../../src/hooks/useLocation";
import { useRiskScores } from "../../src/hooks/useRiskScores";
import { SafetyMap } from "../../src/components/map/SafetyMap";
import { Incident, RiskScore } from "../../src/types";
import { colors } from "../../src/constants";

export default function MapScreen() {
  const { data: incidents, isLoading: incidentsLoading } = useIncidents();
  const { data: hotspots, isLoading: hotspotsLoading } = useHotspots();
  const { location } = useLocation();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );

  const bounds = useMemo(() => {
    const lat = location?.latitude ?? 12.9716;
    const lng = location?.longitude ?? 77.5946;
    return {
      sw_lat: lat - 0.05,
      sw_lng: lng - 0.05,
      ne_lat: lat + 0.05,
      ne_lng: lng + 0.05,
    };
  }, [location]);

  const { data: riskScores } = useRiskScores(bounds);

  const loading = incidentsLoading || hotspotsLoading;

  const handleMarkerPress = useCallback((incident: Incident) => {
    setSelectedIncident(incident);
  }, []);

  const handleMapPress = useCallback(() => {
    setSelectedIncident(null);
  }, []);

  const initialRegion = useMemo(
    () => ({
      latitude: location?.latitude ?? 12.9716,
      longitude: location?.longitude ?? 77.5946,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }),
    [location]
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading safety data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafetyMap
        incidents={incidents ?? []}
        hotspots={hotspots ?? []}
        riskScores={(riskScores?.grid as RiskScore[]) ?? []}
        onPress={handleMapPress}
        onMarkerPress={handleMarkerPress}
        initialRegion={initialRegion}
      />

      {selectedIncident && (
        <View style={styles.calloutCard}>
          <Text style={styles.calloutTitle}>{selectedIncident.title}</Text>
          <Text style={styles.calloutType}>
            {selectedIncident.incident_type.replace("_", " ")}
          </Text>
          <Text style={styles.calloutDesc} numberOfLines={3}>
            {selectedIncident.description}
          </Text>
          <Text style={styles.calloutDate}>
            {new Date(selectedIncident.occurred_at).toLocaleString("en-IN")}
          </Text>
        </View>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.typeTheft }]} />
          <Text style={styles.legendText}>Theft</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.typeRobbery }]} />
          <Text style={styles.legendText}>Robbery</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.dot, { backgroundColor: colors.typeHarassment }]}
          />
          <Text style={styles.legendText}>Harassment</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: colors.typeSuspicious }]} />
          <Text style={styles.legendText}>Suspicious</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  calloutCard: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  calloutType: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
    textTransform: "capitalize",
    marginBottom: 4,
  },
  calloutDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  calloutDate: {
    fontSize: 11,
    color: colors.muted,
  },
  legend: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.white + "EE",
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: colors.text,
  },
});
