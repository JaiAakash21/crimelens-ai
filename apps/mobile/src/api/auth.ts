import { supabase } from "../lib/supabase";
import apiClient, { setAuthToken, clearAuthToken } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { User } from "../types";

export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.session?.access_token) {
    await setAuthToken(data.session.access_token);
  }

  const profile = await fetchProfile(data.session?.access_token ?? "");
  useAuthStore.getState().setUser(profile);
  return profile;
};

export const signupWithEmail = async (
  email: string,
  password: string,
  fullName: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) throw error;
  return data;
};

export const logout = async () => {
  await supabase.auth.signOut();
  await clearAuthToken();
  useAuthStore.getState().logout();
};

export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  if (data.session?.access_token) {
    await setAuthToken(data.session.access_token);
    const profile = await fetchProfile(data.session.access_token);
    useAuthStore.getState().setUser(profile);
    return profile;
  }

  useAuthStore.getState().setIsLoading(false);
  return null;
};

export const fetchProfile = async (token: string): Promise<User> => {
  const response = await apiClient.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateProfile = async (data: {
  full_name?: string;
  avatar_url?: string;
}): Promise<User> => {
  const response = await apiClient.patch("/auth/me", data);
  useAuthStore.getState().setUser(response.data);
  return response.data;
};
