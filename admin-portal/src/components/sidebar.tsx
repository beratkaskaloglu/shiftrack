"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { hasPermission, getRoleLabel } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Clock,
  QrCode,
  ClipboardList,
  BarChart3,
  Megaphone,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    minRole: "supervisor" as const,
  },
  {
    href: "/users",
    label: "Kullanici Yonetimi",
    icon: Users,
    minRole: "project_manager" as const,
  },
  {
    href: "/shifts",
    label: "Vardiya Yonetimi",
    icon: Clock,
    minRole: "supervisor" as const,
  },
  {
    href: "/stations",
    label: "Istasyon & QR",
    icon: QrCode,
    minRole: "supervisor" as const,
  },
  {
    href: "/tasks",
    label: "Gorev Atama",
    icon: ClipboardList,
    minRole: "supervisor" as const,
  },
  {
    href: "/reports",
    label: "ML/DL Raporlar",
    icon: BarChart3,
    minRole: "super_admin" as const,
  },
  {
    href: "/announcements",
    label: "Duyurular",
    icon: Megaphone,
    minRole: "project_manager" as const,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#007FE2] flex items-center justify-center">
          <span className="text-white text-sm font-bold">ST</span>
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">ShiftTrack</h1>
          <p className="text-[11px] text-gray-400">Admin Portal</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.filter((item) =>
          hasPermission(user.role, item.minRole)
        ).map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#007FE2]/10 text-[#007FE2] border-l-2 border-[#007FE2]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User section */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-[#007FE2] text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.full_name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {getRoleLabel(user.role)}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cikis Yap
        </button>
      </div>
    </aside>
  );
}
