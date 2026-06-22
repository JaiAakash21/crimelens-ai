import { useQuery } from "@tanstack/react-query";
import { getHotspots } from "../api/hotspots";

export function useHotspots() {
  return useQuery({
    queryKey: ["hotspots"],
    queryFn: getHotspots,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}
