import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";
import type { ApiResponse } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    const response = NextResponse.json<ApiResponse<null>>(
      { success: true, data: null, message: "Çıkış yapıldı." },
      { status: 200 }
    );
    clearAuthCookies(response);
    return response;
  } catch (error) {
    console.error("[POST /api/auth/logout]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
