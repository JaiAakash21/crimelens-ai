export interface DashboardStats {
  total_incidents: number;
  active_hotspots: number;
  avg_safety_score: number;
  incidents_today: number;
  incidents_this_week: number;
  incidents_this_month: number;
  most_common_type: string | null;
  high_risk_areas: { lat: number; lng: number; score: number; level: string }[];
}

export interface TrendDataPoint {
  date: string;
  count: number;
}

export interface CategoryData {
  type: string;
  count: number;
  percentage: number;
}

export interface Incident {
  id: string;
  user_id: string;
  title: string;
  description: string;
  incident_type: string;
  status: string;
  lat: number;
  lng: number;
  gps_accuracy?: number;
  classification?: string;
  confidence?: number;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  images: { id: string; storage_path: string; url?: string }[];
}

export interface Hotspot {
  id: string;
  cluster_id: number;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  point_count: number;
  incident_types: string[];
  risk_level: string;
  geometry_geojson?: Record<string, unknown>;
  created_at: string;
  last_updated: string;
}

export interface RiskScore {
  lat: number;
  lng: number;
  score: number;
  level: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "citizen" | "analyst" | "admin";
  created_at: string;
}
