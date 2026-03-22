import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, CheckInHistory, CheckInRecord } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

    if (isNaN(month) || month < 1 || month > 12 || isNaN(year)) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Geçersiz ay veya yıl parametresi." },
        { status: 400 }
      );
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const logs = await prisma.checkinLog.findMany({
      where: {
        personnelId: user.sub,
        checkedInAt: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { station: true },
      orderBy: { checkedInAt: "desc" },
    });

    const records: CheckInRecord[] = logs.map((log) => ({
      id: log.id,
      personnelId: log.personnelId,
      stationId: log.stationId,
      stationName: log.station.name,
      stationType: log.stationType as "entry" | "work_station",
      checkedInAt: log.checkedInAt.toISOString(),
    }));

    const history: CheckInHistory = { month, year, records };

    return NextResponse.json<ApiResponse<CheckInHistory>>(
      { success: true, data: history },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/check-in/history]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
