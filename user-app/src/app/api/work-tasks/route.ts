import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, WorkTask } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const assignments = await prisma.workAssignment.findMany({
      where: {
        personnelId: user.sub,
        status: { not: "completed" },
      },
      include: {
        workTask: {
          include: { station: true },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    const tasks: WorkTask[] = assignments.map((a) => {
      const actualDuration =
        a.startedAt && a.completedAt
          ? Math.round(
              (new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime()) /
                (1000 * 60)
            )
          : undefined;

      return {
        id: a.id, // assignment id used as task handle
        name: a.workTask.name,
        description: a.workTask.description ?? undefined,
        stationId: a.workTask.stationId,
        stationName: a.workTask.station.name,
        priority: a.workTask.priority as WorkTask["priority"],
        status: a.status as WorkTask["status"],
        expectedDuration: a.workTask.expectedDuration,
        actualDuration,
        startedAt: a.startedAt?.toISOString(),
        completedAt: a.completedAt?.toISOString(),
        assignedAt: a.assignedAt.toISOString(),
      };
    });

    return NextResponse.json<ApiResponse<WorkTask[]>>(
      { success: true, data: tasks },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET /api/work-tasks]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
