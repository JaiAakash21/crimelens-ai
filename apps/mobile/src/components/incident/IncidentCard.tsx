import React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Incident } from "../../types";
import { colors } from "../../constants";

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

interface IncidentCardProps {
  incident: Incident;
  onPress?: () => void;
}

export function IncidentCard({ incident, onPress }: IncidentCardProps) {
  const badgeColor = TYPE_BADGE_COLORS[incident.incident_type] ?? colors.typeOther;
  const statusColor = STATUS_COLORS[incident.status] ?? colors.muted;

  const date = new Date(incident.occurred_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Badge
            label={incident.incident_type.replace("_", " ")}
            color={badgeColor}
          />
          <View
            style={[styles.statusDot, { backgroundColor: statusColor }]}
          />
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {incident.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {incident.description}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.date}>{date}</Text>
          {incident.classification && (
            <Text style={styles.ai}>
              AI: {incident.classification.replace("_", " ")}
              {incident.confidence
                ? ` (${(incident.confidence * 100).toFixed(0)}%)`
                : ""}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 12,
    color: colors.muted,
  },
  ai: {
    fontSize: 11,
    color: colors.accent,
    fontStyle: "italic",
  },
});
