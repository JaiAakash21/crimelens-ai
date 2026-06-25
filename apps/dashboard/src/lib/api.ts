const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken || !API_BASE) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem("auth_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return true;
  } catch {
    return false;
  }
}

function clearAuthAndRedirect() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("refresh_token");
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (!this.baseUrl) {
      console.warn(
        "NEXT_PUBLIC_API_URL is not set. API calls will fail."
      );
    }
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

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && typeof window !== "undefined") {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        const newToken = localStorage.getItem("auth_token");
        headers["Authorization"] = `Bearer ${newToken}`;
        response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        clearAuthAndRedirect();
      }
    }

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
    search?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.per_page) search.set("per_page", String(params.per_page));
    if (params?.type) search.set("incident_type", params.type);
    if (params?.status) search.set("status", params.status);
    if (params?.search) search.set("search", params.search);
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
