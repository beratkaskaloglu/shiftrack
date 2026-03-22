import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, setAuthCookies } from "@/lib/auth";
import type { ApiResponse, UserProfile } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username: string; password: string };

    if (!username || !password) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Kullanıcı adı ve şifre gereklidir." },
        { status: 400 }
      );
    }

    const personnel = await prisma.personnel.findUnique({
      where: { username },
    });

    if (!personnel || !personnel.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Kullanıcı adı veya şifre hatalı." },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, personnel.password);
    if (!passwordValid) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Kullanıcı adı veya şifre hatalı." },
        { status: 401 }
      );
    }

    const tokenPayload = {
      sub: personnel.id,
      username: personnel.username,
      role: personnel.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ]);

    const userProfile: UserProfile = {
      id: personnel.id,
      username: personnel.username,
      firstName: personnel.firstName,
      lastName: personnel.lastName,
      email: personnel.email ?? undefined,
      phone: personnel.phone ?? undefined,
      platform: personnel.platform,
      project: personnel.project,
      personnelNo: personnel.personnelNo ?? undefined,
      avatarUrl: personnel.avatarUrl ?? undefined,
      role: personnel.role as UserProfile["role"],
      isActive: personnel.isActive,
    };

    const response = NextResponse.json<ApiResponse<{ user: UserProfile }>>(
      { success: true, data: { user: userProfile }, message: "Giriş başarılı." },
      { status: 200 }
    );

    setAuthCookies(response, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
