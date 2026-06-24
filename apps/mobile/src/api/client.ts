import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../constants";

const TOKEN_KEY = "auth_token";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // SecureStore may fail on web
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch {
        // SecureStore may fail on web
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const clearAuthToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
};

export default apiClient;
