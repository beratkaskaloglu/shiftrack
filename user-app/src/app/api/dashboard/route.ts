import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type {
  ApiResponse,
  DashboardData,
  CurrentShift,
  Announcement,
  CheckInRecord,
} from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Fetch all dashboard data in parallel
    const [shiftAssignment, announcements, todayCheckin] = await Promise.all([
      // Current shift assignment
      prisma.shiftAssignment.findFirst({
        where: {
          personnelId: user.sub,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: startOfDay } }],
        },
        include: { shift: true },
        orderBy: { startDate: "desc" },
      }),

      // Active announcements (latest 5)
      prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Today's first check-in (entry type preferred)
      prisma.checkinLog.findFirst({
        where: {
          personnelId: user.sub,
          checkedInAt: { gte: startOfDay },
        },
        include: { station: true },
        orderBy: { checkedInAt: "asc" },
      }),
    ]);

    // Build CurrentShift
    let currentShift: CurrentShift | null = null;
    if (shiftAssignment) {
      const [startHour, startMin] = shiftAssignment.shift.startTime.split(":").map(Number);
      const [endHour, endMin] = shiftAssignment.shift.endTime.split(":").map(Number);

      const shiftStart = new Date();
      shiftStart.setHours(startHour, startMin, 0, 0);
      const shiftEnd = new Date();
      shiftEnd.setHours(endHour, endMin, 0, 0);

      let isActive: boolean;
      if (shiftEnd <= shiftStart) {
        isActive = now >= shiftStart || now <= shiftEnd;
      } else {
        isActive = now >= shiftStart && now <= shiftEnd;
      }

      currentShift = {
        shift: {
          id: shiftAssignment.shift.id,
          name: shiftAssignment.shift.name,
          type: shiftAssignment.shift.type as "A" | "B" | "C",
          startTime: shiftAssignment.shift.startTime,
          endTime: shiftAssignment.shift.endTime,
          project: shiftAssignment.shift.project,
        },
        assignment: {
          id: shiftAssignment.id,
          personnelId: shiftAssignment.personnelId,
          shiftId: shiftAssignment.shiftId,
          shift: {
            id: shiftAssignment.shift.id,
            name: shiftAssignment.shift.name,
            type: shiftAssignment.shift.type as "A" | "B" | "C",
            startTime: shiftAssignment.shift.startTime,
            endTime: shiftAssignment.shift.endTime,
            project: shiftAssignment.shift.project,
          },
          startDate: shiftAssignment.startDate.toISOString(),
          endDate: shiftAssignment.endDate?.toISOString(),
        },
        isActive,
      };
    }

    // Build announcements list
    const announcementList: Announcement[] = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      imageUrl: a.imageUrl ?? undefined,
      createdAt: a.createdAt.toISOString(),
      isActive: a.isActive,
    }));

    // Build today's check-in record
    let todayCheckIn: CheckInRecord | null = null;
    if (todayCheckin) {
      todayCheckIn = {
        id: todayCheckin.id,
        personnelId: todayCheckin.personnelId,
        stationId: todayCheckin.stationId,
        stationName: todayCheckin.station.name,
        stationType: todayCheckin.stationType as "entry" | "work_station",
        checkedInAt: todayCheckin.checkedInAt.toISOString(),
      };
    }

    const dashboard: DashboardData = {
      currentShift,
      announcements: announcementList,
      todayCheckIn,
      quickLinks: [], // Quick links are configuration-driven; extend as needed
    };

    return NextResponse.json<ApiResponse<DashboardData>>(
      { success: true, data: dashboard },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
