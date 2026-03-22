"use client";

import { useState } from "react";
import { useThemeStore } from "@/store/themeStore";

const FONT_OPTIONS = [
  { value: "nunito", label: "Nunito Sans (Varsayılan)" },
  { value: "inter", label: "Inter" },
  { value: "roboto", label: "Roboto" },
];

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-[#007FE2]" : "bg-[#CCCCCC]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action: React.ReactNode;
}

function SettingsRow({ icon, title, description, action }: SettingsRowProps) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-[#CCCCCC] dark:border-[#555555] last:border-0">
      <div className="w-10 h-10 rounded-full bg-[#007FE2]/10 flex items-center justify-center flex-shrink-0">
        <span className="text-[#007FE2]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#333333] dark:text-white text-sm font-semibold">{title}</p>
        {description && (
          <p className="text-[#808080] text-xs font-light mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TooltipIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v1M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function FontIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 20l4-10 4 10M5.5 16h5M15 8v12M12 8h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LangIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 3c-2 3-3 6-3 9s1 6 3 9M12 3c2 3 3 6 3 9s-1 6-3 9M3 12h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NotifIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SettingsPage() {
  const { theme, toggleTheme } = useThemeStore();
  const [tooltipsEnabled, setTooltipsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedFont, setSelectedFont] = useState("nunito");

  const isDark = theme === "dark";

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="bg-[#007FE2] px-4 pt-5 pb-4">
        <h1 className="text-white font-bold text-lg">Ayarlar</h1>
        <p className="text-white/70 text-sm font-light">Uygulama tercihlerinizi yönetin</p>
      </div>

      <div className="px-4 pt-4 pb-8 flex flex-col gap-4">
        {/* Appearance */}
        <div>
          <p className="text-[#808080] text-xs font-semibold uppercase tracking-wider mb-2 px-1">
            Görünüm
          </p>
          <div className="bg-white dark:bg-[#444444] rounded-card shadow-card px-4">
            <SettingsRow
              icon={<MoonIcon />}
              title="Karanlık Mod"
              description={isDark ? "Karanlık tema aktif" : "Açık tema aktif"}
              action={
                <Toggle checked={isDark} onChange={() => toggleTheme()} />
              }
            />
            <SettingsRow
              icon={<FontIcon />}
              title="Yazı Tipi"
              description="Uygulama genelinde kullanılan yazı tipi"
              action={
                <select
                  value={selectedFont}
                  onChange={(e) => setSelectedFont(e.target.value)}
                  className="text-sm font-semibold text-[#007FE2] bg-transparent border-none outline-none cursor-pointer"
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-[#333333]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              }
            />
          </div>
        </div>

        {/* Behavior */}
        <div>
          <p className="text-[#808080] text-xs font-semibold uppercase tracking-wider mb-2 px-1">
            Davranış
          </p>
          <div className="bg-white dark:bg-[#444444] rounded-card shadow-card px-4">
            <SettingsRow
              icon={<TooltipIcon />}
              title="Araç İpuçları"
              description="Düğmeler ve alanlar için yardım ipuçlarını göster"
              action={
                <Toggle checked={tooltipsEnabled} onChange={setTooltipsEnabled} />
              }
            />
            <SettingsRow
              icon={<NotifIcon />}
              title="Bildirimler"
              description="Vardiya ve duyuru bildirimleri"
              action={
                <Toggle checked={notificationsEnabled} onChange={setNotificationsEnabled} />
              }
            />
          </div>
        </div>

        {/* Language */}
        <div>
          <p className="text-[#808080] text-xs font-semibold uppercase tracking-wider mb-2 px-1">
            Dil & Bölge
          </p>
          <div className="bg-white dark:bg-[#444444] rounded-card shadow-card px-4">
            <SettingsRow
              icon={<LangIcon />}
              title="Dil"
              description="Türkçe"
              action={
                <span className="text-[#808080] text-xs font-light">Türkçe</span>
              }
            />
          </div>
        </div>

        {/* App info */}
        <div>
          <p className="text-[#808080] text-xs font-semibold uppercase tracking-wider mb-2 px-1">
            Uygulama Bilgisi
          </p>
          <div className="bg-white dark:bg-[#444444] rounded-card shadow-card px-4">
            <div className="flex items-center justify-between py-4 border-b border-[#CCCCCC] dark:border-[#555555]">
              <p className="text-[#333333] dark:text-white text-sm font-semibold">Versiyon</p>
              <p className="text-[#808080] text-sm font-light">v1.0.0</p>
            </div>
            <div className="flex items-center justify-between py-4">
              <p className="text-[#333333] dark:text-white text-sm font-semibold">Yapımcı</p>
              <p className="text-[#808080] text-sm font-light">Arvato Systems</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
