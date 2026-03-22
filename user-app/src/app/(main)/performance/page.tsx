"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import type { WeeklyPerformance } from "@/types";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const DAY_NAMES_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d;
}

function getDatesInMonth(year: number, month: number): Date[] {
  const dates = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function isSameWeek(date: Date, weekStart: Date): boolean {
  const weekEnd = getWeekEnd(weekStart);
  return date >= weekStart && date <= weekEnd;
}

function generatePlaceholderPerformance(weekStart: Date): WeeklyPerformance {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const isWorkDay = d.getDay() !== 0 && d.getDay() !== 6;
    days.push({
      date: d.toISOString().split("T")[0],
      dayName: DAY_NAMES_SHORT[i],
      turnstileHours: isWorkDay ? 7.5 + Math.random() * 1 : 0,
      activityHours: isWorkDay ? 6.5 + Math.random() * 1.5 : 0,
      isWorkDay,
    });
  }
  return {
    weekStartDate: weekStart.toISOString().split("T")[0],
    weekEndDate: getWeekEnd(weekStart).toISOString().split("T")[0],
    platform: "Arvato GmbH",
    project: "Returns Processing",
    shift: {
      id: "s1",
      name: "A Vardiyası",
      type: "A",
      startTime: "06:00",
      endTime: "14:00",
      project: "Returns Processing",
    },
    days,
    totalTurnstileHours: days.reduce((a, d) => a + d.turnstileHours, 0),
    totalActivityHours: days.reduce((a, d) => a + d.activityHours, 0),
  };
}


export default function PerformancePage() {
  const user = useAuthStore((s) => s.user);
  const today = new Date();
  const currentYear = today.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(getWeekStart(today));
  const [performance, setPerformance] = useState<WeeklyPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadPerformance = useCallback(() => {
    if (!user) return;
    setIsLoading(true);
    const ws = selectedWeekStart.toISOString().split("T")[0];
    fetch(`/api/performance?weekStart=${ws}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) setPerformance(data.data);
        else setPerformance(generatePlaceholderPerformance(selectedWeekStart));
      })
      .catch(() => {
        setPerformance(generatePlaceholderPerformance(selectedWeekStart));
      })
      .finally(() => setIsLoading(false));
  }, [user, selectedWeekStart]);

  useEffect(() => {
    loadPerformance();
  }, [loadPerformance]);

  const datesInMonth = getDatesInMonth(currentYear, selectedMonth);
  const firstDow = datesInMonth[0].getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;

  const handleDayClick = (date: Date) => {
    const ws = getWeekStart(date);
    setSelectedWeekStart(ws);
  };

  const getDayCellClass = (date: Date) => {
    const dow = date.getDay();
    if (isSameWeek(date, selectedWeekStart)) return "bg-[#22C55E] text-white";
    if (dow === 0 || dow === 6) return "bg-[#F97316]/20 text-[#F97316]";
    return "bg-[#F5F5F5] dark:bg-[#555555] text-[#333333] dark:text-white";
  };

  const isToday = (date: Date) => date.toISOString().split("T")[0] === today.toISOString().split("T")[0];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-[#007FE2] px-4 pt-5 pb-4">
        <h1 className="text-white font-bold text-lg">Haftalık Performans</h1>
        <p className="text-white/70 text-sm font-light">Turnikeler ve aktivite saatleri</p>
      </div>

      <div className="flex flex-col md:flex-row min-h-full">
        {/* Month sidebar (horizontal on mobile, vertical on desktop) */}
        <div className="md:w-24 bg-white dark:bg-[#444444] border-b md:border-b-0 md:border-r border-[#CCCCCC] dark:border-[#555555]">
          <div className="flex md:flex-col overflow-x-auto md:overflow-x-hidden">
            {MONTHS.map((name, i) => {
              const m = i + 1;
              const isSelected = m === selectedMonth;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`flex-shrink-0 px-3 py-3 md:py-4 text-xs font-semibold transition-colors whitespace-nowrap md:whitespace-normal ${
                    isSelected
                      ? "bg-[#22C55E]/10 text-[#22C55E] border-b-2 md:border-b-0 md:border-r-2 border-[#22C55E]"
                      : "text-[#808080] hover:text-[#333333] dark:hover:text-white"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-4 p-4 pb-8">
          {/* Calendar */}
          <div className="bg-white dark:bg-[#444444] rounded-card shadow-card overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <p className="text-[#333333] dark:text-white font-bold text-sm">
                {MONTHS[selectedMonth - 1]} {currentYear}
              </p>
              <p className="text-[#808080] text-xs font-light">Haftayı seçmek için güne tıklayın</p>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#CCCCCC] dark:border-[#555555] mt-2">
              {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
                <div key={d} className={`py-1.5 text-center text-xs font-semibold ${
                  d === "Cmt" || d === "Paz" ? "text-[#F97316]" : "text-[#808080]"
                }`}>
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 p-1 gap-0.5">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {datesInMonth.map((date) => {
                const dayNum = date.getDate();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDayClick(date)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                      getDayCellClass(date)
                    } ${isToday(date) ? "ring-2 ring-[#007FE2]" : ""}`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Week info */}
          {performance && (
            <div className="bg-white dark:bg-[#444444] rounded-card shadow-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-[#007FE2] font-semibold uppercase tracking-wide">Seçili Hafta</p>
                  <p className="text-[#333333] dark:text-white font-bold text-sm mt-0.5">
                    {new Date(performance.weekStartDate + "T12:00:00").toLocaleDateString("tr-TR", {
                      day: "numeric", month: "short",
                    })}
                    {" – "}
                    {new Date(performance.weekEndDate + "T12:00:00").toLocaleDateString("tr-TR", {
                      day: "numeric", month: "short",
                    })}
                  </p>
                </div>
                {isLoading && (
                  <div className="w-5 h-5 border-2 border-[#007FE2] border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[#007FE2] text-xs font-semibold">Platform</p>
                  <p className="text-[#333333] dark:text-white text-xs font-normal">{performance.platform}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[#007FE2] text-xs font-semibold">Proje</p>
                  <p className="text-[#333333] dark:text-white text-xs font-normal">{performance.project}</p>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[#007FE2] text-xs font-semibold">Vardiya</p>
                  <p className="text-[#333333] dark:text-white text-xs font-normal">{performance.shift.name}</p>
                </div>
              </div>

              {/* Days table */}
              <div className="rounded-lg overflow-hidden border border-[#CCCCCC] dark:border-[#555555]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F5F5F5] dark:bg-[#555555]">
                      <th className="py-2 px-2 text-left text-[#808080] font-semibold">Gün</th>
                      <th className="py-2 px-2 text-center text-[#808080] font-semibold">Turnik.</th>
                      <th className="py-2 px-2 text-center text-[#808080] font-semibold">Aktivite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.days.map((day) => (
                      <tr
                        key={day.date}
                        className={`border-t border-[#CCCCCC] dark:border-[#555555] ${
                          !day.isWorkDay ? "opacity-50" : ""
                        }`}
                      >
                        <td className="py-2 px-2 font-semibold text-[#333333] dark:text-white">
                          {day.dayName}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={`font-semibold ${day.isWorkDay ? "text-[#007FE2]" : "text-[#808080]"}`}>
                            {day.isWorkDay ? `${day.turnstileHours.toFixed(1)}s` : "—"}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={`font-semibold ${day.isWorkDay ? "text-[#22C55E]" : "text-[#808080]"}`}>
                            {day.isWorkDay ? `${day.activityHours.toFixed(1)}s` : "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#CCCCCC] dark:border-[#555555] bg-[#F5F5F5] dark:bg-[#555555]">
                      <td className="py-2 px-2 font-bold text-[#333333] dark:text-white">Toplam</td>
                      <td className="py-2 px-2 text-center font-bold text-[#007FE2]">
                        {performance.totalTurnstileHours.toFixed(1)}s
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-[#22C55E]">
                        {performance.totalActivityHours.toFixed(1)}s
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {!performance && !isLoading && (
            <div className="bg-white dark:bg-[#444444] rounded-card shadow-card p-6 flex items-center justify-center">
              <p className="text-[#808080] text-sm">Bu hafta için veri bulunamadı.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
