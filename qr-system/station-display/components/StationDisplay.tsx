"use client";

import clsx from "clsx";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useStationToken } from "../hooks/useStationToken";
import { fetchStation, type StationResponse } from "../lib/api";

interface StationDisplayProps {
  stationId: string;
}

export function StationDisplay({ stationId }: StationDisplayProps) {
  const { token, loading, error, refreshToken } = useStationToken(stationId);
  const [station, setStation] = useState<StationResponse | null>(null);
  const [now, setNow] = useState(new Date());
  const [justScanned, setJustScanned] = useState(false);
  const prevTokenRef = useRef<string | null>(null);

  // Clock tick
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch station info
  useEffect(() => {
    fetchStation(stationId).then(setStation).catch(console.error);
  }, [stationId]);

  // Flash "scanned" animation when the token changes
  useEffect(() => {
    if (!token) return;
    if (prevTokenRef.current && prevTokenRef.current !== token.token) {
      setJustScanned(true);
      setTimeout(() => setJustScanned(false), 1200);
    }
    prevTokenRef.current = token.token;
  }, [token?.token]);

  const stationTypeLabel = station?.type === "entry" ? "Giriş Kapısı" : "İş İstasyonu";

  return (
    <div className="min-h-screen bg-white dark:bg-[#333333] flex flex-col items-center justify-center font-nunito select-none">
      {/* Top bar */}
      <div className="w-full bg-arvato-blue px-6 py-4 flex items-center justify-between fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-xl">ShiftTrack</span>
          {station && (
            <span className="text-white/70 text-sm">
              {station.warehouse ? `${station.warehouse} · ` : ""}
              {stationTypeLabel}
            </span>
          )}
        </div>
        <span className="text-white font-semibold text-lg tabular-nums" suppressHydrationWarning>
          {now.toLocaleTimeString("tr-TR")}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 mt-20 px-8 w-full max-w-lg">
        {station && (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#333333] dark:text-white">
              {station.name}
            </h1>
            <p className="text-arvato-mid-grey text-sm mt-1">{stationTypeLabel}</p>
          </div>
        )}

        {/* QR code card */}
        <div
          className={clsx(
            "relative bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 transition-all duration-300",
            justScanned && "scale-95 opacity-60"
          )}
        >
          {loading && (
            <div className="w-56 h-56 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-arvato-blue border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="w-56 h-56 flex flex-col items-center justify-center gap-4">
              <span className="text-arvato-red text-center text-sm">{error}</span>
              <button
                onClick={refreshToken}
                className="bg-arvato-blue text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Yenile
              </button>
            </div>
          )}

          {!loading && !error && token && (
            <>
              <QRCodeSVG
                value={token.qr_value}
                size={300}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
                includeMargin={true}
              />
              <p className="text-arvato-mid-grey text-xs text-center">
                Telefonunuzu QR koda gösterin
              </p>
            </>
          )}

          {/* Scanned overlay */}
          {justScanned && (
            <div className="absolute inset-0 rounded-3xl bg-green-500/20 flex items-center justify-center">
              <span className="text-green-600 font-bold text-xl">Tarandı ✓</span>
            </div>
          )}
        </div>

        {token && !loading && !error && (
          <TokenExpiry expiresAt={token.expires_at} onExpired={refreshToken} />
        )}

        <p className="text-arvato-mid-grey text-sm text-center max-w-xs">
          Her okutmadan sonra QR otomatik yenilenir.
        </p>

        <button
          onClick={refreshToken}
          className="text-arvato-blue text-sm font-semibold underline underline-offset-2"
        >
          Manuel Yenile
        </button>
      </div>
    </div>
  );
}

// ── Token expiry countdown ────────────────────────────────────────────────────

function TokenExpiry({
  expiresAt,
  onExpired,
}: {
  expiresAt: string;
  onExpired: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setTimeLeft(Math.max(0, ms));
      if (ms <= 0) onExpired();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  const hours = Math.floor(timeLeft / 3_600_000);
  const mins = Math.floor((timeLeft % 3_600_000) / 60_000);
  const secs = Math.floor((timeLeft % 60_000) / 1000);
  const display =
    hours > 0 ? `${hours}s ${mins}dk` : mins > 0 ? `${mins}dk ${secs}sn` : `${secs}sn`;
  const isLow = timeLeft < 60_000;

  return (
    <span
      className={clsx(
        "text-xs tabular-nums",
        isLow ? "text-arvato-red font-semibold" : "text-arvato-mid-grey"
      )}
    >
      Token geçerlilik: {display}
    </span>
  );
}
