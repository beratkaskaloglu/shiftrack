"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  expectedStationId?: string;
}

export function QRScanner({ personnelId, mode, onSuccess, onClose, expectedStationId }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    doneRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();
      setScanning(true);

      const onDetected = (raw: string) => {
        if (doneRef.current) return;
        doneRef.current = true;
        stopCamera();
        setProcessing(true);
        const parsed = parseQRValue(raw);
        if (!parsed) { setError("Geçersiz QR kodu"); setProcessing(false); return; }
        if (expectedStationId && parsed.stationId !== expectedStationId) {
          setError("Bu QR kodu bu istasyona ait değil"); setProcessing(false); return;
        }
        validateToken({ token: parsed.token, station_id: parsed.stationId, personnel_id: personnelId })
          .then((result) => {
            if (!result.valid) { setError(result.message); return; }
            onSuccess({ valid: true, station_name: result.station_name, station_type: result.station_type, message: result.message });
          })
          .catch((err) => setError(err instanceof Error ? err.message : "Bağlantı hatası"))
          .finally(() => setProcessing(false));
      };

      // Try BarcodeDetector first (Chrome/Safari 17+), fall back to jsQR
      const hasBarcodeDetector = "BarcodeDetector" in window;
      setDebugInfo(hasBarcodeDetector ? "BarcodeDetector aktif" : "jsQR aktif");

      if (hasBarcodeDetector) {
        // @ts-expect-error BarcodeDetector is not in TypeScript types yet
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const tick = async () => {
          if (doneRef.current) return;
          if (video.readyState >= 2) {
            try {
              // @ts-expect-error BarcodeDetector is not in TypeScript types yet
              const codes = await detector.detect(video);
              setDebugInfo(`BarcodeDetector: ${video.videoWidth}x${video.videoHeight} — ${codes.length} kod`);
              if (codes.length > 0) { onDetected(codes[0].rawValue); return; }
            } catch { /* ignore */ }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } else {
        const jsQR = (await import("jsqr")).default;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        let frameCount = 0;
        const tick = () => {
          if (doneRef.current) return;
          if (video.readyState >= 2 && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qr = jsQR(img.data, img.width, img.height);
            frameCount++;
            if (frameCount % 30 === 0) setDebugInfo(`jsQR: ${video.videoWidth}x${video.videoHeight} — frame ${frameCount}`);
            if (qr?.data) { onDetected(qr.data); return; }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kamera başlatılamadı";
      setError(msg.includes("NotAllowed") || msg.includes("Permission")
        ? "Kamera izni reddedildi — Safari Ayarlar > Gizlilik > Kamera"
        : msg);
    }
  }, [personnelId, expectedStationId, onSuccess, stopCamera]);

  const modalTitle = mode === "check_in" ? "Check-In — QR Tara" : "İş Görevi — QR Tara";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white dark:bg-[#333333] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="bg-[#007FE2] px-5 py-4 flex items-center justify-between">
          <span className="text-white font-bold text-base">{modalTitle}</span>
          <button onClick={() => { stopCamera(); onClose(); }} className="text-white/80 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="p-5 flex flex-col items-center gap-4">
          <div className="relative w-64 h-64 rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
            <canvas ref={canvasRef} className="hidden" />
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-44 h-44 border-2 border-white/80 rounded-xl" />
              </div>
            )}
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {error && (
            <div className="w-full bg-[#D11A4C]/10 border border-[#D11A4C]/30 rounded-lg px-4 py-3 flex items-start gap-2">
              <span className="text-[#D11A4C] text-sm flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-[#D11A4C] font-bold text-base leading-none">×</button>
            </div>
          )}

          <p className="text-[#808080] text-sm text-center">
            {scanning ? "Kamerayı QR koda tutun — otomatik okur" : "Başlatmak için butona basın"}
          </p>

          {debugInfo && (
            <p className="text-[10px] text-[#AAAAAA] text-center font-mono">{debugInfo}</p>
          )}

          {!scanning ? (
            <button onClick={startCamera} disabled={processing} className="w-full bg-[#007FE2] text-white font-semibold py-3 rounded-lg text-sm active:opacity-80 disabled:opacity-50">
              Kamerayı Aç
            </button>
          ) : (
            <button onClick={stopCamera} className="w-full border border-[#CCCCCC] text-[#808080] font-semibold py-3 rounded-lg text-sm active:opacity-80">
              Durdur
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
