import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { ApiResponse, WorkTask } from "@/types";

// ── useWorkTasks ──────────────────────────────────────────────────────────────

export function useWorkTasks() {
  return useQuery({
    queryKey: ["work-tasks"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WorkTask[]>>("/api/work-tasks");
      return data.data;
    },
  });
}

// ── useStartWorkTask ──────────────────────────────────────────────────────────

export function useStartWorkTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      stationId,
      token,
    }: {
      id: string;
      stationId: string;
      token: string;
    }) => {
      const { data } = await api.post<ApiResponse<WorkTask>>(
        `/api/work-tasks/${id}/start`,
        { stationId, token }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-tasks"] });
    },
  });
}

// ── useCompleteWorkTask ───────────────────────────────────────────────────────

export function useCompleteWorkTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { data } = await api.post<ApiResponse<WorkTask>>(
        `/api/work-tasks/${id}/complete`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-tasks"] });
    },
  });
}
