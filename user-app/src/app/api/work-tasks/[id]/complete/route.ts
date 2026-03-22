import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, WorkTask } from "@/types";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const { id: assignmentId } = params;

    const assignment = await prisma.workAssignment.findFirst({
      where: { id: assignmentId, personnelId: user.sub },
      include: { workTask: { include: { station: true } } },
    });

    if (!assignment) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "İş görevi bulunamadı." },
        { status: 404 }
      );
    }

    if (assignment.status !== "in_progress") {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message: "Yalnızca devam eden görevler tamamlanabilir.",
        },
        { status: 409 }
      );
    }

    const now = new Date();

    const updated = await prisma.workAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "completed",
        completedAt: now,
      },
      include: { workTask: { include: { station: true } } },
    });

    // Record work log
    await prisma.workLog.create({
      data: {
        workAssignmentId: assignmentId,
        stationId: updated.workTask.stationId,
        action: "stop",
        scannedAt: now,
      },
    });

    const actualDuration =
      updated.startedAt
        ? Math.round((now.getTime() - new Date(updated.startedAt).getTime()) / (1000 * 60))
        : undefined;

    const task: WorkTask = {
      id: updated.id,
      name: updated.workTask.name,
      description: updated.workTask.description ?? undefined,
      stationId: updated.workTask.stationId,
      stationName: updated.workTask.station.name,
      priority: updated.workTask.priority as WorkTask["priority"],
      status: updated.status as WorkTask["status"],
      expectedDuration: updated.workTask.expectedDuration,
      actualDuration,
      startedAt: updated.startedAt?.toISOString(),
      completedAt: updated.completedAt?.toISOString(),
      assignedAt: updated.assignedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<WorkTask>>(
      { success: true, data: task, message: "Görev tamamlandı." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/work-tasks/[id]/complete]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
