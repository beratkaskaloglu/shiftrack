"use client";

/**
 * QRTokenTable — drop into the Admin Portal's QR Management page.
 * Lists token statuses, supports filtering, and runs cleanup.
 *
 * Usage:
 *   import { QRTokenTable } from "@/qr/admin-components/components/QRTokenTable";
 *   <QRTokenTable />
 */

import { useEffect, useState } from "react";
import {
  cleanupExpiredTokens,
  fetchTokenList,
  generateToken,
  type TokenListResponse,
  type TokenStatusItem,
} from "../lib/adminApi";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: "Aktif", className: "bg-green-100 text-green-700 border-green-200" },
  used: { label: "Kullanıldı", className: "bg-gray-100 text-gray-600 border-gray-200" },
  expired: { label: "Süresi Doldu", className: "bg-red-100 text-red-600 border-red-200" },
};

export function QRTokenTable() {
  const [data, setData] = useState<TokenListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupMsg, setCleanupMsg] = useState<string | null>(null);

  const load = async (stationId?: string) => {
    setLoading(true);
    try {
      const result = await fetchTokenList({ station_id: stationId, limit: 100 });
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCleanup = async () => {
    const res = await cleanupExpiredTokens();
    setCleanupMsg(res.message);
    await load();
    setTimeout(() => setCleanupMsg(null), 3000);
  };

  const handleGenerateToken = async (stationId: string) => {
    await generateToken(stationId);
    await load();
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard label="Aktif" count={data.active_count} color="text-green-600" />
          <SummaryCard label="Kullanıldı" count={data.used_count} color="text-gray-500" />
          <SummaryCard label="Süresi Doldu" count={data.expired_count} color="text-red-500" />
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">QR Token Listesi</h2>
        <div className="flex gap-2">
          {cleanupMsg && (
            <span className="text-sm text-green-600 font-medium self-center">{cleanupMsg}</span>
          )}
          <button
            onClick={handleCleanup}
            className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            Süresi Dolmuşları Temizle
          </button>
          <button
            onClick={() => load()}
            className="text-sm bg-[#007FE2] text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            Yenile
          </button>
        </div>
      </div>

      {/* Token table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">İstasyon</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Token</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Oluşturuldu</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Kullanıldı</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Son Geçerlilik</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Aksiyon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Yükleniyor...
                </td>
              </tr>
            )}
            {!loading && data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Token bulunamadı
                </td>
              </tr>
            )}
            {!loading &&
              data?.items.map((item) => (
                <TokenRow key={item.id} item={item} onGenerateToken={handleGenerateToken} />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TokenRow({
  item,
  onGenerateToken,
}: {
  item: TokenStatusItem;
  onGenerateToken: (stationId: string) => void;
}) {
  const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.expired;
  const shortToken = item.token.slice(0, 8) + "…";

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 font-medium text-gray-900">{item.station_name}</td>
      <td className="px-4 py-3 font-mono text-gray-500 text-xs" title={item.token}>
        {shortToken}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
          {badge.label}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {new Date(item.created_at).toLocaleString("tr-TR")}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {item.used_at ? new Date(item.used_at).toLocaleString("tr-TR") : "—"}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {new Date(item.expires_at).toLocaleString("tr-TR")}
      </td>
      <td className="px-4 py-3">
        {item.status === "active" && (
          <button
            onClick={() => onGenerateToken(item.station_id)}
            className="text-xs text-[#007FE2] hover:underline"
          >
            Yeni Üret
          </button>
        )}
      </td>
    </tr>
  );
}

function SummaryCard({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{count}</p>
    </div>
  );
}
