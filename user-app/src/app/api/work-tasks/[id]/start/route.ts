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

    // Body must contain QR scan data: { stationId, token }
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

    // Validate assignment belongs to user and is in pending state
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

    if (assignment.status !== "pending") {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "Bu görev zaten başlatılmış veya tamamlanmış." },
        { status: 409 }
      );
    }

    // Verify the scanned station matches the task's station
    if (assignment.workTask.stationId !== stationId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: "QR kod bu görevin istasyonuna ait değil." },
        { status: 400 }
      );
    }

    const now = new Date();

    const updated = await prisma.workAssignment.update({
      where: { id: assignmentId },
      data: {
        status: "in_progress",
        startedAt: now,
      },
      include: { workTask: { include: { station: true } } },
    });

    // Record work log
    await prisma.workLog.create({
      data: {
        workAssignmentId: assignmentId,
        stationId,
        action: "start",
        scannedAt: now,
      },
    });

    const task: WorkTask = {
      id: updated.id,
      name: updated.workTask.name,
      description: updated.workTask.description ?? undefined,
      stationId: updated.workTask.stationId,
      stationName: updated.workTask.station.name,
      priority: updated.workTask.priority as WorkTask["priority"],
      status: updated.status as WorkTask["status"],
      expectedDuration: updated.workTask.expectedDuration,
      startedAt: updated.startedAt?.toISOString(),
      assignedAt: updated.assignedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<WorkTask>>(
      { success: true, data: task, message: "Görev başlatıldı." },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /api/work-tasks/[id]/start]", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
