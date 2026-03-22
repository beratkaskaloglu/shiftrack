import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, AttendanceSummary, AttendanceDay, AttendanceStatus } from "@/types";

// Turkish public holidays (static list; extend as needed)
const PUBLIC_HOLIDAYS_2025 = [
  "2025-01-01",
  "2025-04-23",
  "2025-05-01",
  "2025-05-19",
  "2025-07-15",
  "2025-08-30",
  "2025-10-29",
];

const PUBLIC_HOLIDAYS_2026 = [
  "2026-01-01",
  "2026-04-23",
  "2026-05-01",
  "2026-05-19",
  "2026-07-15",
  "2026-08-30",
  "2026-10-29",
];

function getPublicHolidays(year: number): string[] {
  if (year === 2025) return PUBLIC_HOLIDAYS_2025;
  if (year === 2026) return PUBLIC_HOLIDAYS_2026;
  return [];
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
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

    // Fetch turnstile logs from DB for the month
    const turnstileLogs = await prisma.turnstileLog.findMany({
      where: {
        personnelId: user.sub,
        entryTime: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { entryTime: "asc" },
    });

    // Build a map: dateString -> { entryTime, exitTime }
    const turnstileMap = new Map<string, { entry: string; exit?: string }>();
    for (const log of turnstileLogs) {
      const dateStr = toDateString(log.entryTime);
      if (!turnstileMap.has(dateStr)) {
        turnstileMap.set(dateStr, {
          entry: log.entryTime.toISOString(),
          exit: log.exitTime?.toISOString(),
        });
      }
    }

    const publicHolidays = new Set(getPublicHolidays(year));
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = toDateString(new Date());

    const days: AttendanceDay[] = [];
    let workingDays = 0;
    const leaveDays = 0;
    let holidayDays = 0;
    let absentDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d);
      const dateStr = toDateString(date);

      // Skip future dates beyond today
      if (dateStr > today) {
        days.push({ date: dateStr, status: "absent" }); // placeholder; frontend can hide
        continue;
      }

      let status: AttendanceStatus;
      const turnstileEntry = turnstileMap.get(dateStr);

      if (publicHolidays.has(dateStr)) {
        status = "holiday";
        holidayDays++;
      } else if (isWeekend(date)) {
        status = "holiday";
        holidayDays++;
      } else if (turnstileEntry) {
        status = "working";
        workingDays++;
      } else {
        status = "absent";
        absentDays++;
      }

      days.push({
        date: dateStr,
        status,
        turnstileEntry: turnstileEntry?.entry,
        turnstileExit: turnstileEntry?.exit,
      });
    }

    const summary: AttendanceSummary = {
      month,
      year,
      workingDays,
      leaveDays,
      holidayDays,
      absentDays,
      days,
    };

    return NextResponse.json<ApiResponse<AttendanceSummary>>(
      { success: true, data: summary },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/attendance]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
