/**
 * Sends a token validation request to the User App's API route.
 * The Next.js API route at /api/qr/validate proxies this to the QR Token API.
 */
import axios from "axios";

export interface ValidateTokenPayload {
  token: string;
  station_id: string;
  personnel_id: string;
}

export interface ValidateTokenResult {
  valid: boolean;
  station_name?: string;
  station_type?: "entry" | "work_station";
  used_at?: string;
  message: string;
}

const USER_APP_API = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function validateToken(
  payload: ValidateTokenPayload
): Promise<ValidateTokenResult> {
  const { data } = await axios.post<ValidateTokenResult>(
    `${USER_APP_API}/api/qr/validate`,
    payload
  );
  return data;
}
