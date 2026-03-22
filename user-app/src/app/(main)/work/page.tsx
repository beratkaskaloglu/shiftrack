"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { QRScanner } from "@/qr/scanner/components/QRScanner";
import type { WorkTask, WorkTaskStatus, WorkTaskPriority } from "@/types";

const PLACEHOLDER_TASKS: WorkTask[] = [
  {
    id: "t1",
    name: "Palet Boşaltma – Zon A",
    stationId: "st1",
    stationName: "İstasyon A-12",
    priority: "high",
    status: "in_progress",
    expectedDuration: 60,
    actualDuration: 35,
    startedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    assignedAt: new Date(Date.now() - 90 * 60000).toISOString(),
  },
  {
    id: "t2",
    name: "Ürün Tasnifi – İadeler",
    stationId: "st2",
    stationName: "İstasyon B-03",
    priority: "medium",
    status: "pending",
    expectedDuration: 45,
    assignedAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "t3",
    name: "Etiket Basma",
    stationId: "st3",
    stationName: "İstasyon C-07",
    priority: "low",
    status: "pending",
    expectedDuration: 30,
    assignedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "t4",
    name: "Ambalaj Kontrolü",
    stationId: "st4",
    stationName: "İstasyon A-01",
    priority: "high",
    status: "completed",
    expectedDuration: 40,
    actualDuration: 38,
    startedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 82 * 60000).toISOString(),
    assignedAt: new Date(Date.now() - 130 * 60000).toISOString(),
  },
];

const STATUS_CONFIG: Record<WorkTaskStatus, { label: string; classes: string }> = {
  pending: { label: "Bekliyor", classes: "bg-[#808080]/20 text-[#808080]" },
  in_progress: { label: "Devam Ediyor", classes: "bg-[#007FE2]/20 text-[#007FE2]" },
  completed: { label: "Tamamlandı", classes: "bg-[#22C55E]/20 text-[#22C55E]" },
};

const PRIORITY_CONFIG: Record<WorkTaskPriority, { label: string; color: string }> = {
  high: { label: "Yüksek", color: "text-[#D11A4C]" },
  medium: { label: "Orta", color: "text-[#F97316]" },
  low: { label: "Düşük", color: "text-[#808080]" },
};

function ProgressBar({ expected, actual }: { expected: number; actual?: number }) {
  const pct = actual ? Math.min((actual / expected) * 100, 100) : 0;
  const isOver = actual ? actual > expected : false;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-[#808080]">
        <span>Geçen: {actual ? `${actual}dk` : "—"}</span>
        <span>Beklenen: {expected}dk</span>
      </div>
      <div className="h-1.5 bg-[#CCCCCC] dark:bg-[#555555] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOver ? "bg-[#D11A4C]" : "bg-[#007FE2]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: WorkTask;
  onStart: (task: WorkTask) => void;
  onComplete: (task: WorkTask) => void;
}

function TaskCard({ task, onStart, onComplete }: TaskCardProps) {
  const statusCfg = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];

  return (
    <div className="bg-white dark:bg-[#444444] rounded-card shadow-card p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-[#333333] dark:text-white leading-tight">
            {task.name}
          </h3>
          <p className="text-[#808080] text-xs mt-0.5">{task.stationName}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${statusCfg.classes}`}>
            {statusCfg.label}
          </span>
          <span className={`text-xs font-semibold ${priorityCfg.color}`}>
            ● {priorityCfg.label}
          </span>
        </div>
      </div>

      {task.status !== "pending" && (
        <div className="mb-3">
          <ProgressBar expected={task.expectedDuration} actual={task.actualDuration} />
        </div>
      )}

      {task.status === "completed" && task.completedAt && (
        <p className="text-xs text-[#808080] font-light mb-2">
          Tamamlandı:{" "}
          {new Date(task.completedAt).toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}

      {task.status === "pending" && (
        <button
          onClick={() => onStart(task)}
          className="w-full mt-2 bg-[#007FE2] text-white text-sm font-semibold py-2.5 rounded-lg active:opacity-80 transition-opacity"
        >
          Başlat (QR Tara)
        </button>
      )}

      {task.status === "in_progress" && (
        <button
          onClick={() => onComplete(task)}
          className="w-full mt-2 bg-[#22C55E] text-white text-sm font-semibold py-2.5 rounded-lg active:opacity-80 transition-opacity"
        >
          Tamamla (QR Tara)
        </button>
      )}
    </div>
  );
}

export default function WorkPage() {
  const user = useAuthStore((s) => s.user);
  const [tasks, setTasks] = useState<WorkTask[]>(PLACEHOLDER_TASKS);
  const [scanTarget, setScanTarget] = useState<{ task: WorkTask; action: "start" | "complete" } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetch("/api/work/tasks")
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.length) setTasks(data.data);
      })
      .catch(() => {});
  }, [user]);

  const handleStart = (task: WorkTask) => {
    setScanTarget({ task, action: "start" });
  };

  const handleComplete = (task: WorkTask) => {
    setScanTarget({ task, action: "complete" });
  };

  const handleScanSuccess = useCallback(() => {
    if (!scanTarget) return;
    const { task, action } = scanTarget;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== task.id) return t;
        if (action === "start") {
          return { ...t, status: "in_progress", startedAt: new Date().toISOString() };
        } else {
          const elapsed = t.startedAt
            ? Math.round((Date.now() - new Date(t.startedAt).getTime()) / 60000)
            : t.expectedDuration;
          return {
            ...t,
            status: "completed",
            actualDuration: elapsed,
            completedAt: new Date().toISOString(),
          };
        }
      })
    );

    setSuccessMsg(
      action === "start"
        ? `"${task.name}" görevi başlatıldı.`
        : `"${task.name}" görevi tamamlandı.`
    );
    setScanTarget(null);

    setTimeout(() => setSuccessMsg(null), 3000);
  }, [scanTarget]);

  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-[#007FE2] px-4 pt-5 pb-4">
        <h1 className="text-white font-bold text-lg">İş Görevleri</h1>
        <p className="text-white/70 text-sm font-light">
          {activeTasks.length} aktif görev
        </p>
      </div>

      <div className="px-4 pt-4 pb-8 flex flex-col gap-4">
        {/* Success message */}
        {successMsg && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg px-4 py-3">
            <p className="text-[#22C55E] text-sm font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Active tasks */}
        {activeTasks.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[#333333] dark:text-white font-bold text-sm">Aktif Görevler</h2>
            {activeTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStart={handleStart}
                onComplete={handleComplete}
              />
            ))}
          </div>
        )}

        {activeTasks.length === 0 && (
          <div className="bg-white dark:bg-[#444444] rounded-card shadow-card p-6 flex flex-col items-center gap-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#22C55E" strokeWidth="2" />
              <path d="M9 12l2 2 4-4" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[#808080] text-sm text-center font-light">Tüm görevler tamamlandı.</p>
          </div>
        )}

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-[#333333] dark:text-white font-bold text-sm">Tamamlananlar</h2>
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStart={handleStart}
                onComplete={handleComplete}
              />
            ))}
          </div>
        )}
      </div>

      {/* QR Scanner modal */}
      {scanTarget && user && (
        <QRScanner
          personnelId={user.id}
          mode="work"
          expectedStationId={scanTarget.task.stationId}
          onSuccess={handleScanSuccess}
          onClose={() => setScanTarget(null)}
        />
      )}
    </div>
  );
}
