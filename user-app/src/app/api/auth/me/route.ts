import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, UserProfile } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const personnel = await prisma.personnel.findUnique({
      where: { id: user.sub },
    });

    if (!personnel || !personnel.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

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

    return NextResponse.json<ApiResponse<UserProfile>>(
      { success: true, data: userProfile },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
