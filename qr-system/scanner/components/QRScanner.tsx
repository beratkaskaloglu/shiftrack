"use client";

/**
 * QRScanner — reusable scanning component to be imported by the User App
 *
 * Usage (Check-In or Work page):
 *
 *   import { QRScanner } from "@/qr/scanner/components/QRScanner";
 *
 *   <QRScanner
 *     personnelId={user.id}
 *     mode="check_in"          // or "work"
 *     onSuccess={(result) => console.log(result)}
 *     onClose={() => setOpen(false)}
 *   />
 */

import clsx from "clsx";
import { useCallback, useId } from "react";
import { useQRScanner } from "../hooks/useQRScanner";
import { parseQRValue } from "../lib/parseQRValue";
import { validateToken } from "../lib/validateToken";

export type ScanMode = "check_in" | "work";

export interface QRScanResult {
  valid: boolean;
  station_name?: string;
  station_type?: "entry" | "work_station";
  message: string;
}

interface QRScannerProps {
  personnelId: string;
  mode: ScanMode;
  onSuccess: (result: QRScanResult) => void;
  onClose: () => void;
  /** Optional: only accept scans from this specific station */
  expectedStationId?: string;
}

export function QRScanner({
  personnelId,
  mode,
  onSuccess,
  onClose,
  expectedStationId,
}: QRScannerProps) {
  // Unique, stable element ID for the html5-qrcode DOM target
  const elementId = useId().replace(/:/g, "");
  const readerId = `qr-reader-${elementId}`;

  const handleScan = useCallback(
    async (raw: string) => {
      const parsed = parseQRValue(raw);
      if (!parsed) {
        throw new Error("Geçersiz QR kodu — ShiftTrack QR'ı değil");
      }

      if (expectedStationId && parsed.stationId !== expectedStationId) {
        throw new Error("Bu QR kodu bu istasyona ait değil");
      }

      const result = await validateToken({
        token: parsed.token,
        station_id: parsed.stationId,
        personnel_id: personnelId,
      });

      if (!result.valid) {
        throw new Error(result.message);
      }

      onSuccess({
        valid: true,
        station_name: result.station_name,
        station_type: result.station_type,
        message: result.message,
      });
    },
    [personnelId, expectedStationId, onSuccess]
  );

  const { startScanning, stopScanning, isScanning, isProcessing, error, clearError } =
    useQRScanner({ elementId: readerId, onScan: handleScan });

  const modalTitle = mode === "check_in" ? "Check-In — QR Tara" : "İş Görevi — QR Tara";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 items-center justify-center p-4">
      <div className="bg-white dark:bg-[#333333] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Modal header */}
        <div className="bg-[#007FE2] px-5 py-4 flex items-center justify-between">
          <span className="text-white font-bold text-base">{modalTitle}</span>
          <button
            onClick={async () => {
              await stopScanning();
              onClose();
            }}
            className="text-white/80 hover:text-white text-xl leading-none"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        {/* Scanner area */}
        <div className="p-5 flex flex-col items-center gap-4">
          {/* html5-qrcode renders into this div */}
          <div
            id={readerId}
            className={clsx(
              "w-64 h-64 rounded-xl overflow-hidden bg-gray-100 relative",
              isProcessing && "opacity-50"
            )}
          />

          {isProcessing && (
            <div className="absolute flex items-center justify-center w-64 h-64">
              <div className="w-10 h-10 border-4 border-[#007FE2] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="w-full bg-[#D11A4C]/10 border border-[#D11A4C]/30 rounded-lg px-4 py-3 flex items-start gap-2">
              <span className="text-[#D11A4C] text-sm flex-1">{error}</span>
              <button onClick={clearError} className="text-[#D11A4C] font-bold text-base leading-none">
                ×
              </button>
            </div>
          )}

          <p className="text-[#808080] text-sm text-center">
            {isScanning
              ? "Kamerayı istasyon QR koduna tutun"
              : "Kamerayı başlatmak için butona basın"}
          </p>

          {!isScanning ? (
            <button
              onClick={startScanning}
              className="w-full bg-[#007FE2] text-white font-semibold py-3 rounded-lg text-sm active:opacity-80"
            >
              Kamerayı Aç
            </button>
          ) : (
            <button
              onClick={stopScanning}
              disabled={isProcessing}
              className="w-full border border-[#CCCCCC] text-[#808080] font-semibold py-3 rounded-lg text-sm active:opacity-80 disabled:opacity-50"
            >
              Durdur
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
