"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";

interface IncidentFiltersProps {
  typeFilter: string;
  statusFilter: string;
  searchQuery: string;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

const incidentTypes = [
  "theft",
  "robbery",
  "harassment",
  "assault",
  "suspicious_activity",
  "vandalism",
  "other",
];

const statuses = ["reported", "under_review", "investigating", "resolved"];

export function IncidentFilters({
  typeFilter,
  statusFilter,
  searchQuery,
  onTypeChange,
  onStatusChange,
  onSearchChange,
  onReset,
}: IncidentFiltersProps) {
  const hasFilters = typeFilter || statusFilter || searchQuery;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search incidents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={typeFilter} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Types</SelectItem>
          {incidentTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onReset} title="Reset filters">
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
