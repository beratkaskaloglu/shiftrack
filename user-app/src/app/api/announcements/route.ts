import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, Announcement } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const data: Announcement[] = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      imageUrl: a.imageUrl ?? undefined,
      createdAt: a.createdAt.toISOString(),
      isActive: a.isActive,
    }));

    return NextResponse.json<ApiResponse<Announcement[]>>(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/announcements]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
