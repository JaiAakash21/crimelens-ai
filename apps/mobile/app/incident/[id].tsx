import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useIncident } from "../../src/hooks/useIncidents";
import { Badge } from "../../src/components/ui/Badge";
import { Card } from "../../src/components/ui/Card";
import { colors } from "../../src/constants";

const TYPE_BADGE_COLORS: Record<string, string> = {
  theft: colors.typeTheft,
  robbery: colors.typeRobbery,
  harassment: colors.typeHarassment,
  assault: colors.typeAssault,
  suspicious_activity: colors.typeSuspicious,
  vandalism: colors.typeVandalism,
  other: colors.typeOther,
};

const STATUS_COLORS: Record<string, string> = {
  reported: colors.warning,
  verified: colors.success,
  investigating: colors.accent,
  resolved: colors.success,
  dismissed: colors.muted,
};

export default function IncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: incident, isLoading, isError } = useIncident(id ?? "");

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !incident) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load incident</Text>
      </View>
    );
  }

  const badgeColor = TYPE_BADGE_COLORS[incident.incident_type] ?? colors.typeOther;
  const statusColor = STATUS_COLORS[incident.status] ?? colors.muted;

  return (
    <>
      <Stack.Screen options={{ headerTitle: incident.title, headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <Badge
              label={incident.incident_type.replace("_", " ")}
              color={badgeColor}
            />
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          </View>
          <Text style={styles.title}>{incident.title}</Text>
          <Text style={styles.date}>
            {new Date(incident.occurred_at).toLocaleString("en-IN")}
          </Text>
        </View>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{incident.description}</Text>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.location}>
            {incident.lat.toFixed(6)}, {incident.lng.toFixed(6)}
          </Text>
          {incident.gps_accuracy && (
            <Text style={styles.meta}>Accuracy: ±{incident.gps_accuracy.toFixed(0)}m</Text>
          )}
        </Card>

        {incident.classification && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>AI Classification</Text>
            <Text style={styles.classification}>
              {incident.classification.replace("_", " ")}
            </Text>
            {incident.confidence !== undefined && (
              <Text style={styles.meta}>
                Confidence: {(incident.confidence * 100).toFixed(0)}%
              </Text>
            )}
          </Card>
        )}

        {incident.images && incident.images.length > 0 && (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            {incident.images.map((img) => (
              <Image
                key={img.id}
                source={{ uri: img.storage_path }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{incident.status.replace("_", " ")}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reported</Text>
            <Text style={styles.detailValue}>
              {new Date(incident.created_at).toLocaleString("en-IN")}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Updated</Text>
            <Text style={styles.detailValue}>
              {new Date(incident.updated_at).toLocaleString("en-IN")}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
  },
  header: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  location: {
    fontSize: 14,
    color: colors.text,
    fontFamily: "monospace",
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  classification: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.accent,
    textTransform: "capitalize",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    textTransform: "capitalize",
  },
});
