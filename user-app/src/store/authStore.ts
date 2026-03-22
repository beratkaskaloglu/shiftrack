import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, LoginRequest, UserProfile } from "@/types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: "Giriş başarısız" }));
            throw new Error(err.message || "Giriş başarısız");
          }

          const data = await res.json();
          set({
            user: data.data?.user ?? data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false, user: null });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user: UserProfile | null) => {
        set({ user, isAuthenticated: user !== null });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/auth/me");
          if (!res.ok) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }
          const data = await res.json();
          const user = data.data?.user ?? data.data ?? null;
          set({ user, isAuthenticated: !!user, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: "shifttrack-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
