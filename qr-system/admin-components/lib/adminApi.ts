import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_QR_API_URL ?? "http://localhost:8000";

export interface TokenStatusItem {
  id: string;
  station_id: string;
  station_name: string;
  token: string;
  used: boolean;
  created_at: string;
  used_at: string | null;
  expires_at: string;
  status: "active" | "used" | "expired";
}

export interface TokenListResponse {
  items: TokenStatusItem[];
  total: number;
  active_count: number;
  used_count: number;
  expired_count: number;
}

export interface StationResponse {
  id: string;
  name: string;
  type: "entry" | "work_station";
  warehouse: string | null;
  display_url: string | null;
  created_at: string;
}

export interface CreateStationPayload {
  name: string;
  type: "entry" | "work_station";
  warehouse?: string;
}

export async function fetchTokenList(params?: {
  station_id?: string;
  limit?: number;
  offset?: number;
}): Promise<TokenListResponse> {
  const { data } = await axios.get<TokenListResponse>(`${API_BASE}/tokens/admin/list`, {
    params,
  });
  return data;
}

export async function cleanupExpiredTokens(): Promise<{ cleaned: number; message: string }> {
  const { data } = await axios.post(`${API_BASE}/tokens/admin/cleanup`);
  return data;
}

export async function generateToken(stationId: string) {
  const { data } = await axios.post(`${API_BASE}/tokens/station/${stationId}/generate`);
  return data;
}

export async function fetchStations(): Promise<StationResponse[]> {
  const { data } = await axios.get<StationResponse[]>(`${API_BASE}/stations`);
  return data;
}

export async function createStation(payload: CreateStationPayload): Promise<StationResponse> {
  const { data } = await axios.post<StationResponse>(`${API_BASE}/stations`, payload);
  return data;
}
