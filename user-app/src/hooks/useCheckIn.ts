import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, CheckInHistory, CheckInRecord } from "@/types";

// ── useCheckIn ────────────────────────────────────────────────────────────────

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stationId,
      stationType,
      token,
    }: {
      stationId: string;
      stationType: "entry" | "work_station";
      token: string;
    }) => {
      const { data } = await api.post<ApiResponse<CheckInRecord>>("/api/check-in", {
        stationId,
        stationType,
        token,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["check-in"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ── useCheckInHistory ─────────────────────────────────────────────────────────

export function useCheckInHistory(month: number, year: number) {
  return useQuery({
    queryKey: ["check-in", "history", month, year],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CheckInHistory>>(
        "/api/check-in/history",
        { params: { month, year } }
      );
      return data.data;
    },
  });
}
