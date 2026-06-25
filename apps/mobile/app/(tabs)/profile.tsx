import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { useAuth, useLogout } from "../../src/hooks/useAuth";
import { useIncidents } from "../../src/hooks/useIncidents";
import { colors } from "../../src/constants";

export default function ProfileScreen() {
  const { user } = useAuth();
  const { logout } = useLogout();
  const { data: incidents, isRefetching, refetch } = useIncidents();
  const incidentList = incidents;
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.avatar}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {(user?.full_name ?? user?.email ?? "U")
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.full_name ?? "User"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role ?? "citizen"}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>
            {incidentList?.length ?? 0}
          </Text>
          <Text style={styles.statLabel}>Reports</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>
            {incidentList?.filter((i) => i.status === "resolved").length ?? 0}
          </Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>
            {incidentList?.filter((i) => i.classification).length ?? 0}
          </Text>
          <Text style={styles.statLabel}>AI Classified</Text>
        </Card>
      </View>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>Account Info</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>User ID</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {user?.id.slice(0, 8)}...
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                })
              : "N/A"}
          </Text>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <Text style={styles.infoTitle}>About CrimeLens AI</Text>
        <Text style={styles.aboutText}>
          CrimeLens AI uses artificial intelligence to classify incidents,
          detect crime hotspots, and compute safety risk scores to help
          citizens make informed decisions about urban safety.
        </Text>
      </Card>

      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="danger"
        style={styles.logoutButton}
      />
    </ScrollView>
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
  avatar: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.white,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 8,
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "capitalize",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.accent,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  infoCard: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
    maxWidth: "60%",
  },
  aboutText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  logoutButton: {
    marginTop: 8,
  },
});
