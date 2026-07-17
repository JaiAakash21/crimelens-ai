import { useEffect } from "react";
import { getCurrentSession, loginWithEmail, signupWithEmail, logout } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    getCurrentSession().catch(() => {}).finally(() => setIsLoading(false));
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
      await logout();
    },
  };
}
