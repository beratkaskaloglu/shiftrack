"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { QRScanner } from "@/qr/scanner/components/QRScanner";
import type { CheckInRecord } from "@/types";

const MONTHS_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

interface CalendarDay {
  date: string;
  day: number;
  hasCheckIn: boolean;
  record?: CheckInRecord;
}

function buildCalendarGrid(
  year: number,
  month: number,
  records: CheckInRecord[]
): Array<CalendarDay | null> {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  const recordMap = new Map(
    records.map((r) => [r.checkedInAt.split("T")[0], r])
  );

  const cells: Array<CalendarDay | null> = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const record = recordMap.get(dateStr);
    cells.push({ date: dateStr, day: d, hasCheckIn: !!record, record });
  }
  return cells;
}

function generatePlaceholderRecords(year: number, month: number): CheckInRecord[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const records: CheckInRecord[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (date > new Date()) break;
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (d % 3 !== 0) {
      records.push({
        id: `ci-${dateStr}`,
        personnelId: "",
        stationId: "entry-1",
        stationName: "Ana Giriş",
        stationType: "entry",
        checkedInAt: `${dateStr}T06:${String(Math.floor(Math.random() * 10)).padStart(2, "0")}:00`,
      });
    }
  }
  return records;
}

export default function CheckInPage() {
  const user = useAuthStore((s) => s.user);
  const today = new Date();
  const [showScanner, setShowScanner] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [year] = useState(today.getFullYear());
  const [month] = useState(today.getMonth() + 1);
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<CheckInRecord | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    fetch(`/api/check-in/history?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.records) {
          setRecords(data.data.records);
          setTodayRecord(data.data.records.find((r: CheckInRecord) => r.checkedInAt.startsWith(todayStr)) ?? null);
        } else {
          const placeholder = generatePlaceholderRecords(year, month);
          setRecords(placeholder);
          setTodayRecord(placeholder.find((r) => r.checkedInAt.startsWith(todayStr)) ?? null);
        }
      })
      .catch(() => {
        const placeholder = generatePlaceholderRecords(year, month);
        setRecords(placeholder);
      });
  }, [user, year, month]);

  const handleScanSuccess = useCallback((result: { valid: boolean; station_name?: string; message: string }) => {
    const newRecord: CheckInRecord = {
      id: `ci-${Date.now()}`,
      personnelId: user?.id ?? "",
      stationId: "entry-1",
      stationName: result.station_name ?? "Giriş",
      stationType: "entry",
      checkedInAt: new Date().toISOString(),
    };
    setRecords((prev) => [...prev, newRecord]);
    setTodayRecord(newRecord);
    setScanSuccess(`Check-in başarılı! İstasyon: ${result.station_name ?? "Giriş"}`);
    setShowScanner(false);
    setTimeout(() => setScanSuccess(null), 4000);
  }, [user]);

  const grid = buildCalendarGrid(year, month, records);
  const todayStr = today.toISOString().split("T")[0];
  const selectedRecord = records.find((r) => r.checkedInAt.startsWith(selectedDate ?? "____"));

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-[#007FE2] px-4 pt-5 pb-4">
        <h1 className="text-white font-bold text-lg">Check-In</h1>
        <p className="text-white/70 text-sm font-light">QR kod ile giriş yapın</p>
      </div>

      <div className="px-4 pt-4 pb-8 flex flex-col gap-4">
        {/* Success message */}
        {scanSuccess && (
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-lg px-4 py-3 flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#22C55E" strokeWidth="2" />
              <path d="M9 12l2 2 4-4" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-[#22C55E] text-sm font-semibold">{scanSuccess}</p>
          </div>
        )}

        {/* Today status card */}
        <div className="bg-white dark:bg-[#444444] rounded-card shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[#808080] text-xs font-light">Bugünün Durumu</p>
              <p className="text-[#333333] dark:text-white font-bold text-sm mt-0.5">
                {today.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                todayRecord
                  ? "bg-[#22C55E]/20 text-[#22C55E]"
                  : "bg-[#808080]/20 text-[#808080]"
              }`}
            >
              {todayRecord ? "Check-in Yapıldı" : "Giriş Yok"}
            </span>
          </div>

          {todayRecord && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-[#808080]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>
                  {new Date(todayRecord.checkedInAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#808080]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>{todayRecord.stationName}</span>
              </div>
            </div>
          )}

          {/* Camera CTA */}
          <button
            onClick={() => setShowScanner(true)}
            className="w-full mt-4 bg-[#007FE2] text-white font-bold text-base py-4 rounded-xl active:opacity-80 transition-opacity flex items-center justify-center gap-2"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2" />
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2" />
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2" />
              <path d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kamerayı Aç
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-[#444444] rounded-card shadow-card overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-[#CCCCCC] dark:border-[#555555]">
            <p className="text-[#333333] dark:text-white font-bold text-sm">
              {MONTHS_SHORT[month - 1]} {year} — Check-in Geçmişi
            </p>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                <span className="text-[#808080] text-xs">Check-in Var</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#CCCCCC]" />
                <span className="text-[#808080] text-xs">Check-in Yok</span>
              </div>
            </div>
          </div>

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

          <div className="grid grid-cols-7 p-1 gap-0.5">
            {grid.map((cell, i) => {
              if (!cell) return <div key={`e-${i}`} className="aspect-square" />;

              const isToday = cell.date === todayStr;
              const isSelected = cell.date === selectedDate;
              const isFuture = cell.date > todayStr;

              return (
                <button
                  key={cell.date}
                  onClick={() => !isFuture && setSelectedDate(cell.date === selectedDate ? null : cell.date)}
                  disabled={isFuture}
                  className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                    isFuture
                      ? "opacity-30 cursor-not-allowed"
                      : isSelected
                      ? "bg-[#007FE2]/10"
                      : "hover:bg-[#F5F5F5] dark:hover:bg-[#555555]"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      cell.hasCheckIn
                        ? "bg-[#22C55E] text-white"
                        : "bg-[#CCCCCC]/30 dark:bg-[#555555] text-[#808080]"
                    } ${isToday ? "ring-2 ring-[#007FE2] ring-offset-1" : ""}`}
                  >
                    {cell.day}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDate && (
          <div className="bg-white dark:bg-[#444444] rounded-card shadow-card p-4">
            <p className="font-bold text-[#333333] dark:text-white text-sm">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            {selectedRecord ? (
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="bg-[#22C55E]/20 text-[#22C55E] px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  Check-in Yapıldı
                </span>
                <span className="text-[#808080]">
                  {new Date(selectedRecord.checkedInAt).toLocaleTimeString("tr-TR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-[#808080] text-xs">{selectedRecord.stationName}</span>
              </div>
            ) : (
              <p className="text-[#808080] text-xs mt-1 font-light">
                Bu gün için check-in kaydı bulunamadı.
              </p>
            )}
          </div>
        )}
      </div>

      {/* QR Scanner modal */}
      {showScanner && user && (
        <QRScanner
          personnelId={user.id}
          mode="check_in"
          onSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
