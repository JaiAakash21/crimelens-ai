import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useIncidents } from "../../src/hooks/useIncidents";
import { IncidentCard } from "../../src/components/incident/IncidentCard";
import { colors } from "../../src/constants";

export default function HistoryScreen() {
  const { data: incidents, isLoading, isRefetching, refetch } = useIncidents();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!incidents || incidents.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No Reports Yet</Text>
        <Text style={styles.emptyText}>
          Your reported incidents will appear here. Tap the Report tab to
          submit your first report.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={incidents}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <IncidentCard incident={item} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 32,
  },
  list: {
    paddingVertical: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
