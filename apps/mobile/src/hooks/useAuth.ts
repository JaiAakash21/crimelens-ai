import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  getCurrentSession,
  fetchProfile,
  loginWithEmail,
  logout as apiLogout,
  signupWithEmail,
} from "../api/auth";
import { setAuthToken, clearAuthToken } from "../api/client";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setIsLoading } = useAuthStore();

  useEffect(() => {
    getCurrentSession().catch(() => {
      useAuthStore.getState().setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        await clearAuthToken();
        useAuthStore.getState().logout();
      } else if (
        session?.access_token &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        await setAuthToken(session.access_token);
        try {
          const profile = await fetchProfile(session.access_token);
          useAuthStore.getState().setUser(profile);
        } catch {
          await apiLogout();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isAuthenticated, isLoading };
}

export function useLogin() {
  return {
    login: async (email: string, password: string) => {
      return loginWithEmail(email, password);
    },
  };
}

export function useSignup() {
  return {
    signup: async (email: string, password: string, fullName: string) => {
      return signupWithEmail(email, password, fullName);
    },
  };
}

export function useLogout() {
  return {
    logout: async () => {
      await apiLogout();
    },
  };
}
