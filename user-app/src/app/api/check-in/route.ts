import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, CheckInRecord } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { stationId, token } = body as { stationId?: string; token?: string };

    if (!stationId || !token) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message: "QR tarama verisi gereklidir (stationId, token).",
        },
        { status: 400 }
      );
    }

    // Verify station exists
    const station = await prisma.station.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "İstasyon bulunamadı." },
        { status: 404 }
      );
    }

    // Prevent duplicate check-in within the same day at the same station
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const existing = await prisma.checkinLog.findFirst({
      where: {
        personnelId: user.sub,
        stationId,
        checkedInAt: { gte: startOfDay },
      },
    });

    if (existing) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message: "Bu istasyona bugün zaten giriş yapıldı.",
        },
        { status: 409 }
      );
    }

    const log = await prisma.checkinLog.create({
      data: {
        personnelId: user.sub,
        stationId,
        stationType: station.type,
      },
      include: { station: true },
    });

    const record: CheckInRecord = {
      id: log.id,
      personnelId: log.personnelId,
      stationId: log.stationId,
      stationName: log.station.name,
      stationType: log.stationType as "entry" | "work_station",
      checkedInAt: log.checkedInAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<CheckInRecord>>(
      { success: true, data: record, message: "Giriş kaydedildi." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/check-in]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
