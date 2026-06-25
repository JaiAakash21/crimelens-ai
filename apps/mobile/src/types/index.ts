export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: "citizen" | "analyst" | "admin";
  created_at: string;
}

export interface Incident {
  id: string;
  user_id: string;
  title: string;
  description: string;
  incident_type: IncidentType;
  status: IncidentStatus;
  lat: number;
  lng: number;
  gps_accuracy?: number;
  classification?: string;
  confidence?: number;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  images: IncidentImage[];
}

export interface IncidentImage {
  id: string;
  incident_id: string;
  storage_path: string;
  width?: number;
  height?: number;
  file_size?: number;
  mime_type: string;
  created_at: string;
}

export interface IncidentCreate {
  title: string;
  description: string;
  incident_type: string;
  lat: number;
  lng: number;
  gps_accuracy?: number;
  occurred_at: string;
}

export interface Hotspot {
  id: string;
  cluster_id: number;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  point_count: number;
  incident_types: string[];
  risk_level: RiskLevel;
  geometry_geojson?: Record<string, unknown>;
  created_at: string;
  last_updated: string;
}

export interface RiskScore {
  lat: number;
  lng: number;
  score: number;
  level: RiskLevel;
  factors: Record<string, number>;
  grid_cell_id?: string;
}

export interface DashboardStats {
  total_incidents: number;
  active_hotspots: number;
  avg_safety_score: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

export type IncidentType =
  | "theft"
  | "robbery"
  | "harassment"
  | "assault"
  | "suspicious_activity"
  | "vandalism"
  | "other";

export type IncidentStatus =
  | "reported"
  | "verified"
  | "investigating"
  | "resolved"
  | "dismissed";

export type RiskLevel = "low" | "moderate" | "high" | "critical";
