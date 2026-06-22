const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("auth_token")
        : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: `HTTP ${response.status}`,
      }));
      throw new Error(error.detail ?? `Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  getDashboardStats() {
    return this.request<import("@/types").DashboardStats>("/dashboard/stats");
  }

  getTrends(days = 30) {
    return this.request<{ daily: { date: string; count: number }[] }>(
      `/dashboard/trends?days=${days}`
    );
  }

  getCategories(days = 30) {
    return this.request<{ categories: import("@/types").CategoryData[] }>(
      `/dashboard/categories?days=${days}`
    );
  }

  getIncidents(params?: {
    page?: number;
    per_page?: number;
    type?: string;
    status?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.per_page) search.set("per_page", String(params.per_page));
    if (params?.type) search.set("incident_type", params.type);
    if (params?.status) search.set("status", params.status);
    return this.request<{
      items: import("@/types").Incident[];
      total: number;
      page: number;
      per_page: number;
      has_next: boolean;
    }>(`/incidents?${search.toString()}`);
  }

  getHotspots() {
    return this.request<{ items: import("@/types").Hotspot[] }>("/hotspots");
  }

  getRiskScores(swLat: number, swLng: number, neLat: number, neLng: number) {
    return this.request<{ grid: import("@/types").RiskScore[] }>(
      `/risk-scores?sw_lat=${swLat}&sw_lng=${swLng}&ne_lat=${neLat}&ne_lng=${neLng}`
    );
  }

  getUsers() {
    return this.request<import("@/types").UserProfile[]>("/auth/users");
  }

  getProfile() {
    return this.request<import("@/types").UserProfile>("/auth/me");
  }
}

export const api = new ApiClient(API_BASE);
