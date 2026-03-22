import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, DashboardData } from "@/types";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardData>>("/api/dashboard");
      return data.data;
    },
  });
}
