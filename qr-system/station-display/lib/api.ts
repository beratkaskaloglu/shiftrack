import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface TokenResponse {
  token: string;
  station_id: string;
  expires_at: string;
  qr_value: string;
}

export interface StationResponse {
  id: string;
  name: string;
  type: "entry" | "work_station";
  warehouse: string | null;
  display_url: string | null;
}

export async function fetchCurrentToken(stationId: string): Promise<TokenResponse> {
  const { data } = await axios.get<TokenResponse>(
    `${API_BASE}/tokens/station/${stationId}/current`
  );
  return data;
}

export async function generateNewToken(stationId: string): Promise<TokenResponse> {
  const { data } = await axios.post<TokenResponse>(
    `${API_BASE}/tokens/station/${stationId}/generate`
  );
  return data;
}

export async function fetchStation(stationId: string): Promise<StationResponse> {
  const { data } = await axios.get<StationResponse>(
    `${API_BASE}/stations/${stationId}`
  );
  return data;
}
