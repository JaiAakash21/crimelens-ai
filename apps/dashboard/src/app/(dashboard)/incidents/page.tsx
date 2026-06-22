"use client";

import { useState } from "react";
import { useIncidents } from "@/hooks/use-api";
import { IncidentTable } from "@/components/incidents/incident-table";
import { IncidentFilters } from "@/components/incidents/incident-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function IncidentsPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useIncidents({
    page,
    per_page: 15,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  });

  const handleReset = () => {
    setTypeFilter("");
    setStatusFilter("");
    setSearchQuery("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Incidents</h2>
          <p className="text-sm text-muted-foreground">
            Manage and review reported incidents
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Incident
        </Button>
      </div>

      <IncidentFilters
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onTypeChange={setTypeFilter}
        onStatusChange={setStatusFilter}
        onSearchChange={setSearchQuery}
        onReset={handleReset}
      />

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-sm text-muted-foreground font-normal">
            {data?.total ?? 0} total incidents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <IncidentTable incidents={data?.items} loading={isLoading} />
        </CardContent>
      </Card>

      {data && data.total > data.per_page && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.page} of {Math.ceil(data.total / data.per_page)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.has_next}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
