import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import axios from "axios";

interface ValidateTokenPayload {
  token: string;
  station_id: string;
  personnel_id: string;
}

interface ValidateTokenResult {
  valid: boolean;
  station_name?: string;
  station_type?: "entry" | "work_station";
  used_at?: string;
  message: string;
}

const QR_TOKEN_API_URL =
  process.env.QR_TOKEN_API_URL ?? "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json(
        { valid: false, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as ValidateTokenPayload;

    // Enforce that personnel_id matches authenticated user
    if (body.personnel_id !== user.sub) {
      return NextResponse.json(
        { valid: false, message: "Yetkisiz personel kimliği." },
        { status: 403 }
      );
    }

    const { data } = await axios.post<ValidateTokenResult>(
      `${QR_TOKEN_API_URL}/tokens/validate`,
      body,
      { timeout: 5000 }
    );

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(error.response.data, {
        status: error.response.status,
      });
    }
    console.error("[POST /api/qr/validate]", error);
    return NextResponse.json(
      { valid: false, message: "QR doğrulama servisi erişilemiyor." },
      { status: 502 }
    );
  }
}
