"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, capitalize, getTypeColor } from "@/lib/utils";
import type { Incident } from "@/types";
import { Eye } from "lucide-react";

interface IncidentTableProps {
  incidents?: Incident[];
  loading?: boolean;
  onView?: (incident: Incident) => void;
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  reported: "destructive",
  under_review: "secondary",
  investigating: "outline",
  resolved: "default",
};

export function IncidentTable({ incidents, loading, onView }: IncidentTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="w-16"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {(!incidents || incidents.length === 0) && (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
              No incidents found
            </TableCell>
          </TableRow>
        )}
        {incidents?.map((incident) => (
          <TableRow key={incident.id}>
            <TableCell className="font-medium max-w-[200px] truncate">
              {incident.title}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className="text-[11px]"
                style={{
                  borderColor: getTypeColor(incident.incident_type),
                  color: getTypeColor(incident.incident_type),
                }}
              >
                {capitalize(incident.incident_type)}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={statusVariant[incident.status] ?? "outline"}
                className="text-[11px]"
              >
                {capitalize(incident.status)}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {incident.lat.toFixed(4)}, {incident.lng.toFixed(4)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
              {formatDate(incident.occurred_at)}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onView?.(incident)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
