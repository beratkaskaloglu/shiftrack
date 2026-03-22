"use client";

import { useState } from "react";
import type { EmbeddedApp } from "@/types";

const APPS: EmbeddedApp[] = [
  {
    id: "enocta",
    name: "Enocta",
    url: "https://www.enocta.com",
    type: "iframe",
  },
  {
    id: "yolport",
    name: "Yolport",
    url: "https://www.yolport.com",
    type: "iframe",
  },
];

function EnoktaIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#007FE2" opacity="0.1" />
      <rect x="10" y="10" width="28" height="28" rx="4" stroke="#007FE2" strokeWidth="2" fill="none" />
      <circle cx="24" cy="20" r="5" stroke="#007FE2" strokeWidth="2" />
      <path d="M14 38c0-5.5 4.5-9 10-9s10 3.5 10 9" stroke="#007FE2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function YolportIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill="#22C55E" opacity="0.1" />
      <path
        d="M24 8C17.37 8 12 13.37 12 20c0 10.5 12 22 12 22s12-11.5 12-22c0-6.63-5.37-12-12-12z"
        stroke="#22C55E"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="24" cy="20" r="5" stroke="#22C55E" strokeWidth="2" />
    </svg>
  );
}

const APP_ICONS: Record<string, React.ReactNode> = {
  enocta: <EnoktaIcon />,
  yolport: <YolportIcon />,
};

const APP_DESCRIPTIONS: Record<string, string> = {
  enocta: "Eğitim ve gelişim platformu",
  yolport: "Ulaşım ve servis takip sistemi",
};

interface AppFrameProps {
  app: EmbeddedApp;
  onClose: () => void;
}

function AppFrame({ app, onClose }: AppFrameProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#333333]">
      {/* Header */}
      <div className="bg-[#007FE2] h-14 flex items-center justify-between px-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-white rounded-lg active:bg-white/20"
          aria-label="Geri"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-white font-bold text-base">{app.name}</span>
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center text-white rounded-lg active:bg-white/20"
          aria-label="Tarayıcıda Aç"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M15 3h6v6M10 14L21 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F5] dark:bg-[#2A2A2A]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-[#007FE2] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#808080] text-sm font-light">Yükleniyor...</p>
            </div>
          </div>
        )}
        <iframe
          src={app.url}
          title={app.name}
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="camera; microphone; geolocation"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
}

export default function AppsPage() {
  const [openApp, setOpenApp] = useState<EmbeddedApp | null>(null);

  return (
    <>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="bg-[#007FE2] px-4 pt-5 pb-4">
          <h1 className="text-white font-bold text-lg">Uygulamalar</h1>
          <p className="text-white/70 text-sm font-light">Bağlı platformlara erişin</p>
        </div>

        <div className="px-4 pt-4 pb-8">
          <div className="grid grid-cols-2 gap-3">
            {APPS.map((app) => (
              <button
                key={app.id}
                onClick={() => setOpenApp(app)}
                className="bg-white dark:bg-[#444444] rounded-card shadow-card p-5 flex flex-col items-center gap-3 active:opacity-70 transition-opacity"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
                  {APP_ICONS[app.id] ?? (
                    <div className="w-16 h-16 rounded-2xl bg-[#007FE2]/10 flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="3" width="7" height="7" rx="1" stroke="#007FE2" strokeWidth="2" />
                        <rect x="14" y="3" width="7" height="7" rx="1" stroke="#007FE2" strokeWidth="2" />
                        <rect x="3" y="14" width="7" height="7" rx="1" stroke="#007FE2" strokeWidth="2" />
                        <rect x="14" y="14" width="7" height="7" rx="1" stroke="#007FE2" strokeWidth="2" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[#333333] dark:text-white font-bold text-sm">{app.name}</p>
                  <p className="text-[#808080] text-xs font-light mt-0.5">
                    {APP_DESCRIPTIONS[app.id] ?? "Uygulama"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[#007FE2]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15 3h6v6M10 14L21 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-xs font-semibold">Aç</span>
                </div>
              </button>
            ))}
          </div>

          {/* Info note */}
          <div className="mt-4 bg-[#0BBBE4]/10 border border-[#0BBBE4]/30 rounded-lg px-4 py-3 flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="9" stroke="#0BBBE4" strokeWidth="2" />
              <path d="M12 8v1M12 11v5" stroke="#0BBBE4" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <p className="text-[#0BBBE4] text-xs font-light leading-relaxed">
              Uygulamalar uygulama içi tarayıcıda açılır. Sorun yaşarsanız &ldquo;Tarayıcıda Aç&rdquo; butonunu kullanın.
            </p>
          </div>
        </div>
      </div>

      {/* App iframe overlay */}
      {openApp && <AppFrame app={openApp} onClose={() => setOpenApp(null)} />}
    </>
  );
}
