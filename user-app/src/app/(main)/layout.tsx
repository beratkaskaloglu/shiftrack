"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Sidebar } from "@/components/Sidebar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth, logout, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#333333]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#007FE2] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#808080] text-sm font-light">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#2A2A2A] flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#007FE2] h-14 flex items-center justify-between px-4 sticky top-0 z-30 shadow-md">
        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex flex-col items-center justify-center gap-[5px] text-white rounded-lg active:bg-white/20 transition-colors"
          aria-label="Menüyü Aç"
        >
          <span className="w-5 h-0.5 bg-white rounded" />
          <span className="w-5 h-0.5 bg-white rounded" />
          <span className="w-5 h-0.5 bg-white rounded" />
        </button>

        {/* Center */}
        <div className="flex flex-col items-center">
          <span className="text-white font-bold text-base leading-tight">ShiftTrack</span>
          {user?.project && (
            <span className="text-white/70 text-[11px] leading-tight truncate max-w-[140px]">
              {user.project}
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            className="w-10 h-10 flex items-center justify-center text-white rounded-lg active:bg-white/20 transition-colors"
            aria-label="Bilgi"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
              <path d="M12 8v1M12 11v5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center text-white rounded-lg active:bg-white/20 transition-colors"
            aria-label="Çıkış Yap"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <polyline
                points="16 17 21 12 16 7"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line x1="21" y1="12" x2="9" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
