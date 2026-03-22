import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, WeeklyPerformance } from "@/types";

export function useWeeklyPerformance(date: string) {
  return useQuery({
    queryKey: ["performance", "weekly", date],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WeeklyPerformance>>(
        "/api/performance/weekly",
        { params: { date } }
      );
      return data.data;
    },
    enabled: Boolean(date),
  });
}
