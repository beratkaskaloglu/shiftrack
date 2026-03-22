import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Announcement, ApiResponse } from "@/types";

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Announcement[]>>("/api/announcements");
      return data.data;
    },
  });
}
