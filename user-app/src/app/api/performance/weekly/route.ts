import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTurnstileLogs, getActivityLogs } from "@/lib/localDataApi";
import type { ApiResponse, WeeklyPerformance, WeeklyPerformanceDay } from "@/types";

// Turkish day names (Mon-Sun)
const TR_DAY_NAMES = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

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
    const dateParam = searchParams.get("date");

    const referenceDate = dateParam ? new Date(dateParam) : new Date();
    if (isNaN(referenceDate.getTime())) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Geçersiz tarih parametresi." },
        { status: 400 }
      );
    }

    const weekStart = getMondayOfWeek(referenceDate);
    const weekEnd = addDays(weekStart, 6);
    weekEnd.setHours(23, 59, 59, 999);

    const startDateStr = toDateString(weekStart);
    const endDateStr = toDateString(weekEnd);

    // Fetch current shift info for the personnel
    const shiftAssignment = await prisma.shiftAssignment.findFirst({
      where: {
        personnelId: user.sub,
        startDate: { lte: weekEnd },
        OR: [{ endDate: null }, { endDate: { gte: weekStart } }],
      },
      include: { shift: true },
      orderBy: { startDate: "desc" },
    });

    const personnel = await prisma.personnel.findUnique({
      where: { id: user.sub },
      select: { platform: true, project: true },
    });

    // Fetch from Local Data API
    const [turnstileLogs, activityLogs] = await Promise.allSettled([
      getTurnstileLogs(user.sub, startDateStr, endDateStr),
      getActivityLogs(user.sub, startDateStr, endDateStr),
    ]);

    const resolvedTurnstile =
      turnstileLogs.status === "fulfilled" ? turnstileLogs.value : [];
    const resolvedActivity =
      activityLogs.status === "fulfilled" ? activityLogs.value : [];

    // Build maps: dateString -> hours
    const turnstileHoursMap = new Map<string, number>();
    for (const log of resolvedTurnstile) {
      const dateStr = log.entryTime.split("T")[0];
      if (log.entryTime && log.exitTime) {
        const entry = new Date(log.entryTime).getTime();
        const exit = new Date(log.exitTime).getTime();
        const hours = Math.max(0, (exit - entry) / (1000 * 60 * 60));
        turnstileHoursMap.set(dateStr, (turnstileHoursMap.get(dateStr) ?? 0) + hours);
      }
    }

    const activityHoursMap = new Map<string, number>();
    for (const log of resolvedActivity) {
      const dateStr = log.date.split("T")[0];
      activityHoursMap.set(
        dateStr,
        (activityHoursMap.get(dateStr) ?? 0) + log.totalActivityMinutes / 60
      );
    }

    // Build 7-day array (Mon–Sun)
    const days: WeeklyPerformanceDay[] = [];
    let totalTurnstileHours = 0;
    let totalActivityHours = 0;

    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dateStr = toDateString(day);
      const dayOfWeek = day.getDay();
      const isWorkDay = dayOfWeek !== 0 && dayOfWeek !== 6;

      const turnstileHours = +(turnstileHoursMap.get(dateStr) ?? 0).toFixed(2);
      const activityHours = +(activityHoursMap.get(dateStr) ?? 0).toFixed(2);

      totalTurnstileHours += turnstileHours;
      totalActivityHours += activityHours;

      days.push({
        date: dateStr,
        dayName: TR_DAY_NAMES[dayOfWeek],
        turnstileHours,
        activityHours,
        isWorkDay,
      });
    }

    const result: WeeklyPerformance = {
      weekStartDate: startDateStr,
      weekEndDate: endDateStr,
      platform: personnel?.platform ?? "",
      project: personnel?.project ?? "",
      shift: shiftAssignment
        ? {
            id: shiftAssignment.shift.id,
            name: shiftAssignment.shift.name,
            type: shiftAssignment.shift.type as "A" | "B" | "C",
            startTime: shiftAssignment.shift.startTime,
            endTime: shiftAssignment.shift.endTime,
            project: shiftAssignment.shift.project,
          }
        : {
            id: "",
            name: "Belirtilmemiş",
            type: "A",
            startTime: "00:00",
            endTime: "00:00",
            project: personnel?.project ?? "",
          },
      days,
      totalTurnstileHours: +totalTurnstileHours.toFixed(2),
      totalActivityHours: +totalActivityHours.toFixed(2),
    };

    return NextResponse.json<ApiResponse<WeeklyPerformance>>(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/performance/weekly]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
