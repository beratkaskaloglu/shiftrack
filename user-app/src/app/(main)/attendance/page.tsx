"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import type { AttendanceSummary, AttendanceStatus } from "@/types";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function generatePlaceholderSummary(year: number, month: number): AttendanceSummary {
  const lastDay = new Date(year, month, 0);
  const days = [];

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay(); // 0=Sun
    let status: AttendanceStatus = "working";
    if (dow === 0 || dow === 6) status = "holiday";
    else if (d === 10 || d === 20) status = "leave";

    days.push({
      date: date.toISOString().split("T")[0],
      status,
      turnstileEntry: status === "working" ? `${date.toISOString().split("T")[0]}T06:05:00` : undefined,
      turnstileExit: status === "working" ? `${date.toISOString().split("T")[0]}T14:12:00` : undefined,
    });
  }

  const workingDays = days.filter((d) => d.status === "working").length;
  const leaveDays = days.filter((d) => d.status === "leave").length;
  const holidayDays = days.filter((d) => d.status === "holiday").length;
  const absentDays = lastDay.getDate() - workingDays - leaveDays - holidayDays;

  return { month, year, workingDays, leaveDays, holidayDays, absentDays, days };
}

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  working: "bg-[#22C55E] text-white",
  leave: "bg-[#D11A4C] text-white",
  holiday: "bg-[#F97316] text-white",
  absent: "bg-[#808080] text-white",
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  working: "Çalışma",
  leave: "İzin",
  holiday: "Tatil",
  absent: "Devamsız",
};

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#444444] rounded-card shadow-card p-3 flex flex-col items-center gap-1">
      <span className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm`}>
        {value}
      </span>
      <span className="text-[#808080] text-xs font-light text-center">{label}</span>
    </div>
  );
}

export default function AttendancePage() {
  const user = useAuthStore((s) => s.user);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (!user) return;
    fetch(`/api/attendance?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) setSummary(data.data);
        else setSummary(generatePlaceholderSummary(year, month));
      })
      .catch(() => {
        setSummary(generatePlaceholderSummary(year, month));
      });
  }, [user, year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Build calendar grid
  const buildCalendarGrid = () => {
    if (!summary) return [];
    const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
    // Shift so Monday=0
    const startOffset = firstDow === 0 ? 6 : firstDow - 1;
    const cells: Array<{ date: string; status: AttendanceStatus; day: number } | null> = [];

    for (let i = 0; i < startOffset; i++) cells.push(null);
    summary.days.forEach((d) => {
      cells.push({ date: d.date, status: d.status, day: parseInt(d.date.split("-")[2]) });
    });

    return cells;
  };

  const grid = buildCalendarGrid();
  const selectedDay = summary?.days.find((d) => d.date === selectedDate);

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Header */}
      <div className="bg-[#007FE2] px-4 pt-5 pb-4">
        <h1 className="text-white font-bold text-lg">Vardiya Takvimi</h1>
        <p className="text-white/70 text-sm font-light">Aylık devam özeti</p>
      </div>

      <div className="px-4 -mt-1 flex flex-col gap-4 pt-4">
        {/* Month selector */}
        <div className="bg-white dark:bg-[#444444] rounded-card shadow-card flex items-center justify-between p-3">
          <button
            onClick={prevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#555555] active:opacity-70"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#007FE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="text-[#333333] dark:text-white font-bold text-base">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#555555] active:opacity-70"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="#007FE2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Stats */}
        {summary && (
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="Çalışma" value={summary.workingDays} color="bg-[#22C55E]" />
            <StatCard label="İzin" value={summary.leaveDays} color="bg-[#D11A4C]" />
            <StatCard label="Tatil" value={summary.holidayDays} color="bg-[#F97316]" />
            <StatCard label="Devamsız" value={summary.absentDays} color="bg-[#808080]" />
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {(Object.entries(STATUS_LABEL) as [AttendanceStatus, string][]).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${STATUS_COLOR[status].split(" ")[0]}`} />
              <span className="text-[#808080] text-xs font-light">{label}</span>
            </div>
          ))}
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-[#444444] rounded-card shadow-card overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-[#CCCCCC] dark:border-[#555555]">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className={`py-2 text-center text-xs font-semibold ${
                  d === "Cmt" || d === "Paz" ? "text-[#F97316]" : "text-[#808080]"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          {!summary ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#007FE2] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {grid.map((cell, i) => {
                if (!cell) {
                  return <div key={`empty-${i}`} className="aspect-square" />;
                }
                const isToday = cell.date === today.toISOString().split("T")[0];
                const isSelected = cell.date === selectedDate;

                return (
                  <button
                    key={cell.date}
                    onClick={() => setSelectedDate(cell.date === selectedDate ? null : cell.date)}
                    className={`aspect-square flex flex-col items-center justify-center gap-0.5 transition-all ${
                      isSelected ? "bg-[#007FE2]/10" : "hover:bg-[#F5F5F5] dark:hover:bg-[#555555]"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        STATUS_COLOR[cell.status]
                      } ${isToday ? "ring-2 ring-[#007FE2] ring-offset-1" : ""}`}
                    >
                      {cell.day}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div className="bg-white dark:bg-[#444444] rounded-card shadow-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-[#333333] dark:text-white text-sm">
                {new Date(selectedDay.date + "T12:00:00").toLocaleDateString("tr-TR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[selectedDay.status]}`}>
                {STATUS_LABEL[selectedDay.status]}
              </span>
            </div>
            {selectedDay.turnstileEntry && (
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-[#007FE2] text-xs font-semibold">Giriş</p>
                  <p className="text-[#333333] dark:text-white font-normal">
                    {new Date(selectedDay.turnstileEntry).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {selectedDay.turnstileExit && (
                  <div>
                    <p className="text-[#007FE2] text-xs font-semibold">Çıkış</p>
                    <p className="text-[#333333] dark:text-white font-normal">
                      {new Date(selectedDay.turnstileExit).toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
