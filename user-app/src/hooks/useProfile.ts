import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, UserProfile } from "@/types";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<UserProfile>>("/api/profile");
      return data.data;
    },
  });
}
