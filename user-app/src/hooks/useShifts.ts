import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, CurrentShift } from "@/types";

export function useCurrentShift() {
  return useQuery({
    queryKey: ["shifts", "current"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CurrentShift>>("/api/shifts/current");
      return data.data;
    },
  });
}
