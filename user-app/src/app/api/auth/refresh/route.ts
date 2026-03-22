import { NextRequest, NextResponse } from "next/server";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Yenileme tokeni bulunamadı." },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Geçersiz veya süresi dolmuş token." },
        { status: 401 }
      );
    }

    // Verify the user still exists and is active
    const personnel = await prisma.personnel.findUnique({
      where: { id: payload.sub },
    });

    if (!personnel || !personnel.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Kullanıcı bulunamadı veya devre dışı." },
        { status: 401 }
      );
    }

    const tokenPayload = {
      sub: personnel.id,
      username: personnel.username,
      role: personnel.role,
    };

    const [newAccessToken, newRefreshToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ]);

    const response = NextResponse.json<ApiResponse<null>>(
      { success: true, data: null, message: "Token yenilendi." },
      { status: 200 }
    );

    setAuthCookies(response, newAccessToken, newRefreshToken);

    return response;
  } catch (error) {
    console.error("[POST /api/auth/refresh]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
