import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.getDashboardStats(),
    refetchInterval: 60_000,
  });
}

export function useTrends(days = 30) {
  return useQuery({
    queryKey: ["dashboard", "trends", days],
    queryFn: () => api.getTrends(days),
    refetchInterval: 60_000,
  });
}

export function useCategories(days = 30) {
  return useQuery({
    queryKey: ["dashboard", "categories", days],
    queryFn: () => api.getCategories(days),
    refetchInterval: 60_000,
  });
}

export function useIncidents(params?: {
  page?: number;
  per_page?: number;
  type?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["incidents", params],
    queryFn: () => api.getIncidents(params),
  });
}

export function useHotspots() {
  return useQuery({
    queryKey: ["hotspots"],
    queryFn: () => api.getHotspots(),
    refetchInterval: 120_000,
  });
}

export function useRiskScores(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number
) {
  return useQuery({
    queryKey: ["risk-scores", swLat, swLng, neLat, neLng],
    queryFn: () => api.getRiskScores(swLat, swLng, neLat, neLng),
    enabled: swLat !== undefined && neLat !== undefined,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.getUsers(),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => api.getProfile(),
  });
}
