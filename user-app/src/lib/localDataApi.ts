import axios from "axios";
import type { TurnstileLog, ActivityLog } from "@/types";

const localDataApi = axios.create({
  baseURL: process.env.LOCAL_DATA_API_URL ?? "http://localhost:9000",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Turnstile logs ────────────────────────────────────────────────────────────

export async function getTurnstileLogs(
  personnelId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
): Promise<TurnstileLog[]> {
  const { data } = await localDataApi.get<TurnstileLog[]>("/turnstile-logs", {
    params: { personnelId, startDate, endDate },
  });
  return data;
}

// ── Activity logs ─────────────────────────────────────────────────────────────

export async function getActivityLogs(
  personnelId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
): Promise<ActivityLog[]> {
  const { data } = await localDataApi.get<ActivityLog[]>("/activity-logs", {
    params: { personnelId, startDate, endDate },
  });
  return data;
}
