/**
 * useQRScanner — html5-qrcode based camera QR scanning hook
 *
 * Usage:
 *   const { startScanning, stopScanning, isScanning, error } = useQRScanner({
 *     elementId: "qr-reader",
 *     onScan: async (value) => { ... send token to backend ... }
 *   });
 */

import { useCallback, useEffect, useRef, useState } from "react";

// Dynamic import to avoid SSR issues (window not available on server)
type Html5QrcodeType = import("html5-qrcode").Html5Qrcode;

export interface QRScannerOptions {
  /** DOM element ID — the QRScanner component creates this element */
  elementId: string;
  /** Called on a successful scan. May be async; thrown errors are set on the error state */
  onScan: (decodedValue: string) => Promise<void> | void;
  /** QR box size in pixels (default: 256) */
  qrboxSize?: number;
  /** Cooldown between scans in ms (default: 1500) */
  cooldownMs?: number;
}

export interface UseQRScannerResult {
  startScanning: () => Promise<void>;
  stopScanning: () => Promise<void>;
  isScanning: boolean;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
}

export function useQRScanner({
  elementId,
  onScan,
  qrboxSize = 256,
  cooldownMs = 1500,
}: QRScannerOptions): UseQRScannerResult {
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cooldownRef = useRef(false);

  const stopScanning = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const state = scannerRef.current.getState();
      // State 2 = SCANNING
      if (state === 2) {
        await scannerRef.current.stop();
      }
    } catch {
      // Ignore stop() failures
    } finally {
      setIsScanning(false);
    }
  }, []);

  const startScanning = useCallback(async () => {
    setError(null);

    // SSR guard
    if (typeof window === "undefined") return;

    const { Html5Qrcode } = await import("html5-qrcode");

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(elementId);
    }

    const handleScan = async (decodedText: string) => {
      if (cooldownRef.current || isProcessing) return;

      cooldownRef.current = true;
      setIsProcessing(true);

      try {
        await onScan(decodedText);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "QR işlenemedi";
        setError(msg);
      } finally {
        setIsProcessing(false);
        setTimeout(() => {
          cooldownRef.current = false;
        }, cooldownMs);
      }
    };

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: qrboxSize, height: qrboxSize } },
        handleScan,
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message.includes("Permission") || err.message.includes("NotAllowed")
            ? "Kamera izni reddedildi. Tarayıcı ayarlarından izin verin."
            : err.message
          : "Kamera başlatılamadı";
      setError(msg);
    }
  }, [elementId, onScan, qrboxSize, cooldownMs, isProcessing]);

  // Stop scanner on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    startScanning,
    stopScanning,
    isScanning,
    isProcessing,
    error,
    clearError: () => setError(null),
  };
}
