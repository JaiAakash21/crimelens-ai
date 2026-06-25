"use client";

import { useDashboardStats, useTrends, useCategories, useIncidents } from "@/hooks/use-api";
import { StatCard } from "@/components/dashboard/stat-card";
import { IncidentTrendChart } from "@/components/dashboard/incident-trend-chart";
import { RiskDistributionChart } from "@/components/dashboard/risk-distribution-chart";
import { RecentIncidents } from "@/components/dashboard/recent-incidents";
import { AlertCircle, AlertTriangle, Flame, Shield, Activity } from "lucide-react";

export default function DashboardOverview() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDashboardStats();
  const { data: trends, isLoading: trendsLoading, isError: trendsError } = useTrends(30);
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } = useCategories(30);
  const { data: incidents, isLoading: incidentsLoading, isError: incidentsError } = useIncidents({ per_page: 6 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground">
          Real-time safety intelligence for your city
        </p>
      </div>

      {(statsError || trendsError || categoriesError || incidentsError) && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load some dashboard data. Please try again later.
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Incidents"
          value={stats?.total_incidents ?? 0}
          subtitle="All time reported"
          icon={AlertTriangle}
          loading={statsLoading}
        />
        <StatCard
          title="Active Hotspots"
          value={stats?.active_hotspots ?? 0}
          subtitle="High-risk zones"
          icon={Flame}
          loading={statsLoading}
        />
        <StatCard
          title="Avg Safety Score"
          value={stats?.avg_safety_score?.toFixed(1) ?? "—"}
          subtitle="City-wide average"
          icon={Shield}
          loading={statsLoading}
        />
        <StatCard
          title="Today"
          value={stats?.incidents_today ?? 0}
          subtitle={`${stats?.incidents_this_week ?? 0} this week`}
          icon={Activity}
          loading={statsLoading}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <IncidentTrendChart
          data={trends?.daily}
          loading={trendsLoading}
        />
        <RiskDistributionChart
          data={categories?.categories}
          loading={categoriesLoading}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <RecentIncidents
          incidents={incidents?.items}
          loading={incidentsLoading}
        />
      </div>
    </div>
  );
}
