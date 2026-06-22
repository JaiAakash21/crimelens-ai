import apiClient from "./client";
import { Hotspot } from "../types";

export const getHotspots = async (): Promise<Hotspot[]> => {
  const response = await apiClient.get("/hotspots");
  return response.data.items;
};

export const getRiskScores = async (params: {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}): Promise<{ grid: { lat: number; lng: number; score: number; level: string }[] }> => {
  const response = await apiClient.get("/risk-scores", { params });
  return response.data;
};
