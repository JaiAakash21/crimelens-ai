"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getTypeColor, capitalize } from "@/lib/utils";
import type { Incident } from "@/types";
import { AlertTriangle } from "lucide-react";

interface RecentIncidentsProps {
  incidents?: Incident[];
  loading?: boolean;
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  reported: "destructive",
  under_review: "secondary",
  investigating: "outline",
  resolved: "default",
};

export function RecentIncidents({ incidents, loading }: RecentIncidentsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Recent Incidents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {(!incidents || incidents.length === 0) && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No recent incidents</p>
          </div>
        )}
        {incidents?.slice(0, 6).map((incident) => (
          <div
            key={incident.id}
            className="flex items-center justify-between py-3 border-b last:border-0"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="mt-1 w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: getTypeColor(incident.incident_type) }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{incident.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(incident.occurred_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Badge
                variant={statusVariant[incident.status] ?? "outline"}
                className="text-[10px]"
              >
                {capitalize(incident.status)}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px]"
                style={{
                  borderColor: getTypeColor(incident.incident_type),
                  color: getTypeColor(incident.incident_type),
                }}
              >
                {capitalize(incident.incident_type)}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
