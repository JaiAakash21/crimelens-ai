import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIncident, getMyIncidents, createIncident } from "../api/incidents";
import { IncidentCreate } from "../types";

export function useIncidents() {
  return useQuery({
    queryKey: ["incidents"],
    queryFn: getMyIncidents,
    staleTime: 30_000,
  });
}

export function useIncident(id: string) {
  return useQuery({
    queryKey: ["incident", id],
    queryFn: () => getIncident(id),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      image,
    }: {
      data: IncidentCreate;
      image?: { uri: string; type: string; name: string };
    }) => createIncident(data, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
  });
}
