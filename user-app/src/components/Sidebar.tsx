"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  action?: () => void;
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12L12 3l9 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14 14h2v2h-2zM18 14h3M14 18v3M18 18h3v3h-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WorkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PerformanceIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 17l4-6 4 4 4-8 4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <polyline
        points="16 17 21 12 16 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="21"
        y1="12"
        x2="9"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  const handleLogout = async () => {
    onClose();
    await logout();
    router.push("/login");
  };

  const primaryNav: NavItem[] = [
    { label: "Ana Sayfa", href: "/dashboard", icon: <HomeIcon /> },
    { label: "Profilim", href: "/profile", icon: <ProfileIcon /> },
    { label: "Uygulamalar", href: "/apps", icon: <AppsIcon /> },
  ];

  const secondaryNav: NavItem[] = [
    { label: "Vardiya", href: "/attendance", icon: <CalendarIcon /> },
    { label: "Performans", href: "/performance", icon: <PerformanceIcon /> },
    { label: "Check-In", href: "/check-in", icon: <QrIcon /> },
    { label: "Work", href: "/work", icon: <WorkIcon /> },
  ];

  const tertiaryNav: NavItem[] = [
    { label: "Ayarlar", href: "/settings", icon: <SettingsIcon /> },
    { label: "Çıkış Yap", action: handleLogout, icon: <LogoutIcon /> },
  ];

  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false;

    const itemClass = `flex items-center gap-4 h-14 px-5 relative transition-colors ${
      isActive
        ? "bg-[#007FE2]/10 dark:bg-[#007FE2]/20 text-[#007FE2]"
        : "text-[#333333] dark:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#555555]"
    }`;

    const content = (
      <>
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#007FE2] rounded-r" />
        )}
        <span className={`${isActive ? "text-[#007FE2]" : "text-[#007FE2]"}`}>
          {item.icon}
        </span>
        <span className={`text-base font-semibold font-nunito ${isActive ? "text-[#007FE2]" : ""}`}>
          {item.label}
        </span>
      </>
    );

    if (item.href) {
      return (
        <Link key={index} href={item.href} className={itemClass} onClick={onClose}>
          {content}
        </Link>
      );
    }

    return (
      <button key={index} className={`${itemClass} w-full text-left`} onClick={item.action}>
        {content}
      </button>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[65%] max-w-xs bg-white dark:bg-[#333333] shadow-2xl transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="bg-[#007FE2] px-5 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
            {user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : "ST"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base truncate">
              {user ? `${user.firstName} ${user.lastName}` : "ShiftTrack"}
            </p>
            <p className="text-white/70 text-xs truncate">{user?.platform ?? ""}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto">
          <div className="py-2">
            {primaryNav.map(renderNavItem)}
          </div>

          <div className="border-t border-[#CCCCCC] dark:border-[#555555] py-2">
            {secondaryNav.map(renderNavItem)}
          </div>

          <div className="border-t border-[#CCCCCC] dark:border-[#555555] py-2">
            {tertiaryNav.map((item, i) => {
              const isLogout = item.label === "Çıkış Yap";
              const itemClass = `flex items-center gap-4 h-14 px-5 relative transition-colors w-full text-left ${
                isLogout
                  ? "text-[#D11A4C] hover:bg-[#D11A4C]/5"
                  : "text-[#333333] dark:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#555555]"
              }`;
              if (item.href) {
                return (
                  <a key={i} href={item.href} className={itemClass} onClick={onClose}>
                    <span className={isLogout ? "text-[#D11A4C]" : "text-[#007FE2]"}>{item.icon}</span>
                    <span className="text-base font-semibold font-nunito">{item.label}</span>
                  </a>
                );
              }
              return (
                <button key={i} className={itemClass} onClick={item.action}>
                  <span className={isLogout ? "text-[#D11A4C]" : "text-[#007FE2]"}>{item.icon}</span>
                  <span className="text-base font-semibold font-nunito">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#CCCCCC] dark:border-[#555555]">
          <p className="text-[#808080] text-xs font-light text-center">ShiftTrack v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
