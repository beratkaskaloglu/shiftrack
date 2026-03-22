"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import type { Announcement, CurrentShift, QuickLink } from "@/types";

// ── Placeholder data ───────────────────────────────────────────────────────────

const PLACEHOLDER_SHIFT: CurrentShift = {
  shift: {
    id: "s1",
    name: "A Vardiyası",
    type: "A",
    startTime: "06:00",
    endTime: "14:00",
    project: "Arvato Bochum",
  },
  assignment: {
    id: "sa1",
    personnelId: "",
    shiftId: "s1",
    shift: {
      id: "s1",
      name: "A Vardiyası",
      type: "A",
      startTime: "06:00",
      endTime: "14:00",
      project: "Arvato Bochum",
    },
    startDate: new Date().toISOString(),
  },
  isActive: true,
};

const PLACEHOLDER_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1",
    title: "Yeni Yıl Tatili Duyurusu",
    content:
      "Değerli çalışanlarımız, 1 Ocak 2026 tarihinde fabrika tatil olacaktır. İyi yıllar dileriz.",
    imageUrl: undefined,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isActive: true,
  },
  {
    id: "a2",
    title: "Güvenlik Eğitimi",
    content:
      "15 Mart 2026 tarihinde tüm personele zorunlu yangın güvenliği eğitimi verilecektir.",
    imageUrl: undefined,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isActive: true,
  },
  {
    id: "a3",
    title: "Üretim Hedefleri Güncellendi",
    content:
      "Q1 2026 üretim hedefleri revize edilmiştir. Detaylar için İK departmanına başvurunuz.",
    imageUrl: undefined,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    isActive: true,
  },
];

const PLACEHOLDER_QUICK_LINKS: QuickLink[] = [
  { id: "ql1", label: "İK Portal", icon: "ik", url: "/apps", type: "internal" },
  { id: "ql2", label: "Enocta", icon: "enocta", url: "/apps", type: "internal" },
  { id: "ql3", label: "Yolport", icon: "yolport", url: "/apps", type: "internal" },
];

// ── Ticker Component ───────────────────────────────────────────────────────────

function AnnouncementTicker({ announcements }: { announcements: Announcement[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  return (
    <div className="bg-[#007FE2] px-4 py-2.5 flex items-center gap-3 overflow-hidden">
      <div className="flex-shrink-0 bg-white/20 rounded px-2 py-0.5">
        <span className="text-white text-xs font-bold">DUYURU</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-white text-sm font-semibold truncate">
          {announcements[current]?.title}
        </p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {announcements.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === current ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Current Shift Card ─────────────────────────────────────────────────────────

function ShiftCard({ currentShift }: { currentShift: CurrentShift | null }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (!currentShift) {
    return (
      <div className="bg-white dark:bg-[#444444] rounded-card shadow-card p-4 mx-4 mt-4">
        <p className="text-[#808080] text-sm text-center py-4">Aktif vardiya bulunamadı.</p>
      </div>
    );
  }

  const { shift, isActive } = currentShift;

  return (
    <div className="bg-[#007FE2] rounded-card shadow-card p-5 mx-4 mt-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
      <div className="absolute -right-4 -bottom-6 w-20 h-20 bg-white/5 rounded-full" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-xs font-light uppercase tracking-wider">
              Güncel Vardiya
            </p>
            <p className="text-white font-bold text-xl mt-0.5">{shift.name}</p>
          </div>
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isActive ? "bg-[#22C55E]/20 text-[#22C55E]" : "bg-white/20 text-white/70"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#22C55E]" : "bg-white/50"}`}
            />
            {isActive ? "Aktif" : "Pasif"}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" opacity="0.7" />
              <path d="M12 7v5l3 3" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            </svg>
            <span className="text-white font-semibold text-base">
              {shift.startTime} – {shift.endTime}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
              stroke="white"
              strokeWidth="2"
              opacity="0.7"
            />
            <circle cx="12" cy="9" r="2.5" stroke="white" strokeWidth="2" opacity="0.7" />
          </svg>
          <span className="text-white/80 text-sm">{shift.project}</span>
        </div>

        <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-2xl">{timeStr}</p>
            <p className="text-white/70 text-xs capitalize">{dateStr}</p>
          </div>
          <Link
            href="/attendance"
            className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
          >
            Vardiya Takvimi
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Quick Links ────────────────────────────────────────────────────────────────

function QuickLinkIcon({ icon }: { icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    ik: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="#007FE2" strokeWidth="2" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#007FE2" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    enocta: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="14" rx="2" stroke="#007FE2" strokeWidth="2" />
        <path d="M8 21h8M12 17v4" stroke="#007FE2" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    yolport: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
          stroke="#007FE2"
          strokeWidth="2"
        />
        <circle cx="12" cy="9" r="2.5" stroke="#007FE2" strokeWidth="2" />
      </svg>
    ),
  };
  return <>{icons[icon] ?? <span className="text-2xl">🔗</span>}</>;
}

// ── Announcement Card ──────────────────────────────────────────────────────────

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const date = new Date(announcement.createdAt);
  const dateStr = date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });

  return (
    <div className="bg-white dark:bg-[#444444] rounded-card shadow-card p-4 flex gap-4">
      {/* Image placeholder */}
      <div className="w-16 h-16 rounded-lg bg-[#007FE2]/10 flex items-center justify-center flex-shrink-0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="#007FE2" strokeWidth="2" />
          <circle cx="8.5" cy="8.5" r="1.5" fill="#007FE2" />
          <path
            d="M21 15l-5-5L5 21"
            stroke="#007FE2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-[#333333] dark:text-white leading-tight line-clamp-2">
          {announcement.title}
        </p>
        <p className="text-[#808080] text-xs mt-1 line-clamp-2 font-light">
          {announcement.content}
        </p>
        <p className="text-[#CCCCCC] text-xs mt-2 font-light">{dateStr}</p>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [currentShift, setCurrentShift] = useState<CurrentShift | null>(PLACEHOLDER_SHIFT);
  const [announcements] = useState<Announcement[]>(PLACEHOLDER_ANNOUNCEMENTS);
  const [quickLinks] = useState<QuickLink[]>(PLACEHOLDER_QUICK_LINKS);

  useEffect(() => {
    if (!user) return;
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.currentShift) setCurrentShift(data.data.currentShift);
      })
      .catch(() => {
        // Use placeholder data on error
      });
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Günaydın";
    if (h < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Announcement Ticker */}
      <AnnouncementTicker announcements={announcements} />

      {/* Greeting */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-[#808080] text-sm font-light">{greeting()},</p>
        <h2 className="text-[#333333] dark:text-white font-bold text-xl">
          {user ? `${user.firstName} ${user.lastName}` : "Kullanıcı"}
        </h2>
      </div>

      {/* Current Shift Card */}
      <ShiftCard currentShift={currentShift} />

      {/* Quick Links */}
      <div className="px-4 mt-5">
        <h3 className="text-[#333333] dark:text-white font-bold text-base mb-3">
          Hızlı Bağlantılar
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.id}
              href={link.url}
              className="bg-white dark:bg-[#444444] rounded-card shadow-card p-4 flex flex-col items-center gap-2 active:opacity-70 transition-opacity"
            >
              <div className="w-14 h-14 rounded-xl bg-[#007FE2]/10 flex items-center justify-center">
                <QuickLinkIcon icon={link.icon} />
              </div>
              <span className="text-[#333333] dark:text-white text-xs font-semibold text-center">
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Announcements */}
      <div className="px-4 mt-5 pb-6">
        <h3 className="text-[#333333] dark:text-white font-bold text-base mb-3">
          Duyurular
        </h3>
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
