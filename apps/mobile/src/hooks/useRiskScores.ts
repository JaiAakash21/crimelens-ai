import { useQuery } from "@tanstack/react-query";
import { getRiskScores } from "../api/hotspots";
import { RiskScore } from "../types";

export function useRiskScores(bounds: {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
} | null) {
  return useQuery({
    queryKey: ["risk-scores", bounds],
    queryFn: () => getRiskScores(bounds!),
    enabled: !!bounds,
    staleTime: 60_000,
  });
}

export { RiskScore };
