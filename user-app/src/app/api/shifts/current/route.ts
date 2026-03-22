import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, CurrentShift } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const assignment = await prisma.shiftAssignment.findFirst({
      where: {
        personnelId: user.sub,
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      include: { shift: true },
      orderBy: { startDate: "desc" },
    });

    if (!assignment) {
      return NextResponse.json<ApiResponse<null>>(
        { success: true, data: null, message: "Aktif vardiya bulunamadı." },
        { status: 200 }
      );
    }

    // Determine if current time falls within shift hours
    const now = new Date();
    const [startHour, startMin] = assignment.shift.startTime.split(":").map(Number);
    const [endHour, endMin] = assignment.shift.endTime.split(":").map(Number);

    const shiftStart = new Date();
    shiftStart.setHours(startHour, startMin, 0, 0);
    const shiftEnd = new Date();
    shiftEnd.setHours(endHour, endMin, 0, 0);

    // Handle overnight shifts (e.g. 22:00 - 06:00)
    let isActive: boolean;
    if (shiftEnd <= shiftStart) {
      isActive = now >= shiftStart || now <= shiftEnd;
    } else {
      isActive = now >= shiftStart && now <= shiftEnd;
    }

    const result: CurrentShift = {
      shift: {
        id: assignment.shift.id,
        name: assignment.shift.name,
        type: assignment.shift.type as "A" | "B" | "C",
        startTime: assignment.shift.startTime,
        endTime: assignment.shift.endTime,
        project: assignment.shift.project,
      },
      assignment: {
        id: assignment.id,
        personnelId: assignment.personnelId,
        shiftId: assignment.shiftId,
        shift: {
          id: assignment.shift.id,
          name: assignment.shift.name,
          type: assignment.shift.type as "A" | "B" | "C",
          startTime: assignment.shift.startTime,
          endTime: assignment.shift.endTime,
          project: assignment.shift.project,
        },
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate?.toISOString(),
      },
      isActive,
    };

    return NextResponse.json<ApiResponse<CurrentShift>>(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/shifts/current]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
