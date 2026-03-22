"use client";

/**
 * StationQRPanel — station creation and QR management for the Admin Portal
 *
 * Features:
 * - Create new stations (name, type, warehouse)
 * - View and copy the display URL
 * - Generate embed code
 * - Preview and download QR as PNG (via qrcode.react)
 *
 * Usage:
 *   import { StationQRPanel } from "@/qr/admin-components/components/StationQRPanel";
 *   <StationQRPanel baseDisplayUrl="https://app.shifttrack.com" />
 */

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import {
  createStation,
  fetchStations,
  generateToken,
  type CreateStationPayload,
  type StationResponse,
} from "../lib/adminApi";

interface StationQRPanelProps {
  /** Display URL prefix, e.g. "https://app.shifttrack.com" */
  baseDisplayUrl?: string;
}

export function StationQRPanel({ baseDisplayUrl = "" }: StationQRPanelProps) {
  const [stations, setStations] = useState<StationResponse[]>([]);
  const [selected, setSelected] = useState<StationResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<SVGSVGElement | null>(null);

  const load = async () => {
    const list = await fetchStations();
    setStations(list);
  };

  useEffect(() => {
    load();
  }, []);

  const displayUrl = selected?.display_url
    ? `${baseDisplayUrl}/${selected.display_url}`
    : null;

  const embedCode = displayUrl
    ? `<iframe src="${displayUrl}" width="480" height="320" frameborder="0" allowfullscreen></iframe>`
    : null;

  const copyUrl = async () => {
    if (!displayUrl) return;
    await navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    if (!qrRef.current || !selected) return;
    const svg = qrRef.current;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      const link = document.createElement("a");
      link.download = `${selected.name}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  };

  const handleGenerateNew = async () => {
    if (!selected) return;
    await generateToken(selected.id);
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Left: Station list */}
      <div className="col-span-1 border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <span className="font-semibold text-gray-800 text-sm">İstasyonlar</span>
          <button
            onClick={() => setShowCreate(true)}
            className="text-xs bg-[#007FE2] text-white px-2.5 py-1 rounded-lg"
          >
            + Ekle
          </button>
        </div>
        <div className="divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
          {stations.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">
              Henüz istasyon yok
            </p>
          )}
          {stations.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                selected?.id === s.id ? "bg-blue-50 border-l-2 border-[#007FE2]" : ""
              }`}
            >
              <p className="font-medium text-gray-900 text-sm">{s.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {s.type === "entry" ? "Giriş Kapısı" : "İş İstasyonu"}
                {s.warehouse ? ` · ${s.warehouse}` : ""}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Selected station QR panel */}
      <div className="col-span-2 border border-gray-200 rounded-xl p-6">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Sol listeden bir istasyon seçin
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{selected.name}</h3>
              <p className="text-sm text-gray-500">
                {selected.type === "entry" ? "Giriş Kapısı" : "İş İstasyonu"}
                {selected.warehouse ? ` — ${selected.warehouse}` : ""}
              </p>
            </div>

            {/* Display URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Display URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={displayUrl ?? "—"}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-50 font-mono"
                />
                <button
                  onClick={copyUrl}
                  className="text-sm border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap"
                >
                  {copied ? "Kopyalandı ✓" : "Kopyala"}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Bu URL'i istasyon ekranının tarayıcısına girin — değişmez.
              </p>
            </div>

            {/* Embed code */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Embed Kodu
              </label>
              <textarea
                readOnly
                value={embedCode ?? "—"}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-gray-50 font-mono resize-none"
              />
            </div>

            {/* QR preview + actions */}
            {displayUrl && (
              <div className="flex items-start gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-4 inline-flex">
                  <QRCodeSVG
                    ref={qrRef as any}
                    value={displayUrl}
                    size={160}
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <p className="text-xs text-gray-500">Display URL QR önizlemesi</p>
                  <button
                    onClick={downloadQR}
                    className="text-sm bg-[#007FE2] text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    PNG İndir
                  </button>
                  <button
                    onClick={handleGenerateNew}
                    className="text-sm border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Yeni Token Üret
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create station modal */}
      {showCreate && (
        <CreateStationModal
          onClose={() => setShowCreate(false)}
          onCreated={async (s) => {
            await load();
            setSelected(s);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

// ── Create station modal ──────────────────────────────────────────────────────

function CreateStationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (station: StationResponse) => void;
}) {
  const [form, setForm] = useState<CreateStationPayload>({
    name: "",
    type: "entry",
    warehouse: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("İstasyon adı zorunlu");
      return;
    }
    try {
      setLoading(true);
      const station = await createStation({
        ...form,
        warehouse: form.warehouse || undefined,
      });
      onCreated(station);
    } catch {
      setError("İstasyon oluşturulamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#007FE2] px-5 py-4 flex items-center justify-between">
          <span className="text-white font-bold">Yeni İstasyon</span>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">İstasyon Adı *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="örn: Depo A Giriş Kapısı"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#007FE2]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">Tür *</label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as "entry" | "work_station" })
              }
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#007FE2]"
            >
              <option value="entry">Giriş Kapısı</option>
              <option value="work_station">İş İstasyonu</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">Depo (opsiyonel)</label>
            <input
              value={form.warehouse}
              onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
              placeholder="örn: Depo A"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#007FE2]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#007FE2] text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Oluşturuluyor..." : "İstasyon Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}
