import apiClient from "./client";
import { useAuthStore } from "../store/authStore";
import { Incident, IncidentCreate, PaginatedResponse } from "../types";

export const createIncident = async (
  data: IncidentCreate,
  image?: { uri: string; type: string; name: string }
): Promise<Incident> => {
  const response = await apiClient.post("/incidents", data);
  const incident = response.data;

  if (image) {
    try {
      const formData = new FormData();
      formData.append("file", image as unknown as Blob);

      await apiClient.post(`/incidents/${incident.id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch {
      await apiClient.delete(`/incidents/${incident.id}`).catch(() => {});
      throw new Error("Image upload failed. Incident has been rolled back.");
    }
  }

  return incident;
};

export const getIncidents = async (params?: {
  page?: number;
  per_page?: number;
  incident_type?: string;
  status?: string;
}): Promise<PaginatedResponse<Incident>> => {
  const response = await apiClient.get("/incidents", { params });
  return response.data;
};

export const getIncident = async (id: string): Promise<Incident> => {
  const response = await apiClient.get(`/incidents/${id}`);
  return response.data;
};

export const getMyIncidents = async (): Promise<Incident[]> => {
  const user = useAuthStore.getState().user;
  const response = await apiClient.get("/incidents", {
    params: { per_page: 50, user_id: user?.id },
  });
  return response.data.items;
};
