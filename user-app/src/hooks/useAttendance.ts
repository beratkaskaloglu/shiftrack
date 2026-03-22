import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, AttendanceSummary } from "@/types";

export function useAttendance(month: number, year: number) {
  return useQuery({
    queryKey: ["attendance", month, year],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AttendanceSummary>>("/api/attendance", {
        params: { month, year },
      });
      return data.data;
    },
  });
}
