import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, LoginRequest, UserProfile } from "@/types";

// ── useCurrentUser ────────────────────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserProfile>>("/api/auth/me");
      return data.data;
    },
    retry: false,
  });
}

// ── useLogin ──────────────────────────────────────────────────────────────────

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await api.post<ApiResponse<{ user: UserProfile }>>(
        "/api/auth/login",
        credentials
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });
}

// ── useLogout ─────────────────────────────────────────────────────────────────

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post("/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
