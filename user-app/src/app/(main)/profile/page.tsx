"use client";

import { useAuthStore } from "@/store/authStore";

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-[#CCCCCC] dark:border-[#555555] last:border-0">
      <div className="w-10 h-10 rounded-full bg-[#007FE2]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[#007FE2]">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[#007FE2] text-xs font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-[#333333] dark:text-white text-sm font-normal mt-0.5 break-all">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function UsernameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.6 10.8a15.3 15.3 0 006.6 6.6l2.2-2.2a1 1 0 011.1-.2c1.2.5 2.5.8 3.9.8a1 1 0 011 1V20a1 1 0 01-1 1C9.6 21 3 14.4 3 6a1 1 0 011-1h3.5a1 1 0 011 1c0 1.4.3 2.7.8 3.9a1 1 0 01-.2 1.1L6.6 10.8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlatformIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ProjectIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PersonnelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-[#808080] text-sm">Kullanıcı bilgisi yüklenemedi.</p>
      </div>
    );
  }

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex flex-col min-h-full pb-8">
      {/* Header card */}
      <div className="bg-[#007FE2] px-4 pt-6 pb-10 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center">
          <span className="text-white font-bold text-2xl">{initials}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-white font-bold text-xl">
            {user.firstName} {user.lastName}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                user.isActive
                  ? "bg-[#22C55E]/20 text-[#22C55E]"
                  : "bg-white/20 text-white/60"
              }`}
            >
              {user.isActive ? "Aktif" : "Pasif"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0BBBE4]/20 text-[#0BBBE4]">
              {user.role === "supervisor" ? "Süpervizör" : "Personel"}
            </span>
          </div>
        </div>
      </div>

      {/* Info card — overlaps header */}
      <div className="mx-4 -mt-6 bg-white dark:bg-[#444444] rounded-card shadow-card px-4">
        <InfoRow icon={<UsernameIcon />} label="Kullanıcı Adı" value={user.username} />
        <InfoRow icon={<EmailIcon />} label="E-posta" value={user.email ?? "—"} />
        <InfoRow icon={<PhoneIcon />} label="Telefon" value={user.phone ?? "—"} />
        <InfoRow icon={<PlatformIcon />} label="Platform" value={user.platform} />
        <InfoRow icon={<ProjectIcon />} label="Proje" value={user.project} />
        <InfoRow icon={<PersonnelIcon />} label="Personel No" value={user.personnelNo ?? "—"} />
      </div>
    </div>
  );
}
