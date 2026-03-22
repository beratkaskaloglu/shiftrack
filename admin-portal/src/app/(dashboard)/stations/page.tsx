"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Badge available if needed
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Plus, QrCode, Monitor, Copy, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Station, QRToken } from "@/lib/types";

// ── Mock Station Data ────────────────────────────────────────────────────────

const INITIAL_STATIONS: Station[] = [
  {
    id: "st1",
    name: "Depo A Giris Kapisi",
    type: "entry",
    warehouse: "Depo A",
    display_url: "station/depo-a-giris",
    created_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "st2",
    name: "Depo A - Istasyon 1",
    type: "work_station",
    warehouse: "Depo A",
    display_url: "station/depo-a-ist1",
    created_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "st3",
    name: "Depo B - Kontrol",
    type: "work_station",
    warehouse: "Depo B",
    display_url: "station/depo-b-kontrol",
    created_at: "2024-02-01T08:00:00Z",
  },
];

const INITIAL_TOKENS: QRToken[] = [
  {
    id: "t1",
    station_id: "st1",
    station_name: "Depo A Giris Kapisi",
    token: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    used: false,
    created_at: "2024-03-20T08:00:00Z",
    used_at: null,
    expires_at: "2024-03-21T08:00:00Z",
    status: "active",
  },
  {
    id: "t2",
    station_id: "st2",
    station_name: "Depo A - Istasyon 1",
    token: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    used: true,
    created_at: "2024-03-19T14:00:00Z",
    used_at: "2024-03-19T14:30:00Z",
    expires_at: "2024-03-20T14:00:00Z",
    status: "used",
  },
  {
    id: "t3",
    station_id: "st3",
    station_name: "Depo B - Kontrol",
    token: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    used: false,
    created_at: "2024-03-18T08:00:00Z",
    used_at: null,
    expires_at: "2024-03-19T08:00:00Z",
    status: "expired",
  },
];

const tokenColumnHelper = createColumnHelper<QRToken>();

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
  active: { label: "Aktif", class: "bg-green-100 text-green-700" },
  used: { label: "Kullanildi", class: "bg-gray-100 text-gray-600" },
  expired: { label: "Suresi Doldu", class: "bg-red-100 text-red-600" },
};

export default function StationsPage() {
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS);
  const [tokens, setTokens] = useState<QRToken[]>(INITIAL_TOKENS);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const tokenColumns = useMemo(
    () => [
      tokenColumnHelper.accessor("station_name", {
        header: "Istasyon",
        cell: (info) => (
          <span className="font-medium text-gray-900">{info.getValue()}</span>
        ),
      }),
      tokenColumnHelper.accessor("token", {
        header: "Token",
        cell: (info) => (
          <span className="font-mono text-xs text-gray-500" title={info.getValue()}>
            {info.getValue().slice(0, 8)}...
          </span>
        ),
      }),
      tokenColumnHelper.accessor("status", {
        header: "Durum",
        cell: (info) => {
          const s = STATUS_STYLES[info.getValue()];
          return (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.class}`}>
              {s.label}
            </span>
          );
        },
      }),
      tokenColumnHelper.accessor("created_at", {
        header: "Olusturuldu",
        cell: (info) => (
          <span className="text-xs text-gray-500">
            {new Date(info.getValue()).toLocaleString("tr-TR")}
          </span>
        ),
      }),
      tokenColumnHelper.accessor("used_at", {
        header: "Kullanildi",
        cell: (info) => (
          <span className="text-xs text-gray-500">
            {info.getValue()
              ? new Date(info.getValue()!).toLocaleString("tr-TR")
              : "\u2014"}
          </span>
        ),
      }),
      tokenColumnHelper.accessor("expires_at", {
        header: "Son Gecerlilik",
        cell: (info) => (
          <span className="text-xs text-gray-500">
            {new Date(info.getValue()).toLocaleString("tr-TR")}
          </span>
        ),
      }),
    ],
    []
  );

  const tokenTable = useReactTable({
    data: tokens,
    columns: tokenColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleCreateStation = (station: Omit<Station, "id" | "created_at">) => {
    const slug = station.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const newStation: Station = {
      ...station,
      id: `st${Date.now()}`,
      display_url: `station/${slug}`,
      created_at: new Date().toISOString(),
    };
    setStations((prev) => [...prev, newStation]);
    setSelectedStation(newStation);
    setCreateDialogOpen(false);
    toast.success("Istasyon olusturuldu");
  };

  const handleCopyUrl = async () => {
    if (!selectedStation?.display_url) return;
    await navigator.clipboard.writeText(
      `${baseUrl}/${selectedStation.display_url}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("URL kopyalandi");
  };

  const handleCleanup = () => {
    const count = tokens.filter((t) => t.status === "expired").length;
    setTokens((prev) => prev.filter((t) => t.status !== "expired"));
    toast.success(`${count} suresi dolmus token temizlendi`);
  };

  const displayUrl = selectedStation?.display_url
    ? `${baseUrl}/${selectedStation.display_url}`
    : null;

  const embedCode = displayUrl
    ? `<iframe src="${displayUrl}" width="480" height="320" frameborder="0" allowfullscreen></iframe>`
    : null;

  return (
    <div>
      <PageHeader
        title="Istasyon & QR Yonetimi"
        description="Istasyon olusturma, display URL uretme, token durumlarini izleme"
      />

      <Tabs defaultValue="stations">
        <TabsList>
          <TabsTrigger value="stations" className="gap-2">
            <Monitor className="h-4 w-4" />
            Istasyonlar
          </TabsTrigger>
          <TabsTrigger value="tokens" className="gap-2">
            <QrCode className="h-4 w-4" />
            QR Tokenlari
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stations" className="mt-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Station List */}
            <div className="col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                <span className="font-semibold text-gray-800 text-sm">
                  Istasyonlar
                </span>
                <Button
                  size="sm"
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-[#007FE2] hover:bg-[#0066b8] h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Ekle
                </Button>
              </div>
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
                {stations.length === 0 && (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">
                    Henuz istasyon yok
                  </p>
                )}
                {stations.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStation(s)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                      selectedStation?.id === s.id
                        ? "bg-blue-50 border-l-2 border-[#007FE2]"
                        : ""
                    }`}
                  >
                    <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {s.type === "entry" ? "Giris Kapisi" : "Is Istasyonu"}
                      {s.warehouse ? ` \u00B7 ${s.warehouse}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Station Detail */}
            <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-6">
              {!selectedStation ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm min-h-[300px]">
                  Sol listeden bir istasyon secin
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {selectedStation.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedStation.type === "entry"
                        ? "Giris Kapisi"
                        : "Is Istasyonu"}
                      {selectedStation.warehouse
                        ? ` \u2014 ${selectedStation.warehouse}`
                        : ""}
                    </p>
                  </div>

                  {/* Display URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Display URL
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={displayUrl ?? "\u2014"}
                        className="font-mono text-sm bg-gray-50"
                      />
                      <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        {copied ? "Kopyalandi" : "Kopyala"}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Bu URL istasyon ekraninin tarayicisina girilir — degismez.
                    </p>
                  </div>

                  {/* Embed Code */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Embed Kodu
                    </label>
                    <textarea
                      readOnly
                      value={embedCode ?? "\u2014"}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-gray-50 font-mono resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tokens" className="mt-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Aktif</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {tokens.filter((t) => t.status === "active").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Kullanildi</p>
                <p className="text-2xl font-bold text-gray-500 mt-1">
                  {tokens.filter((t) => t.status === "used").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500">Suresi Doldu</p>
                <p className="text-2xl font-bold text-red-500 mt-1">
                  {tokens.filter((t) => t.status === "expired").length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              QR Token Listesi
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCleanup}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Suresi Dolmuslari Temizle
              </Button>
              <Button
                size="sm"
                className="bg-[#007FE2] hover:bg-[#0066b8]"
                onClick={() => toast.info("Yenilendi")}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Yenile
              </Button>
            </div>
          </div>

          {/* Token table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                {tokenTable.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left font-semibold text-gray-600"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tokenTable.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-400"
                    >
                      Token bulunamadi
                    </td>
                  </tr>
                ) : (
                  tokenTable.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Station Dialog */}
      <CreateStationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateStation}
      />
    </div>
  );
}

// ── Create Station Dialog ────────────────────────────────────────────────────

function CreateStationDialog({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (station: Omit<Station, "id" | "created_at">) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    type: "entry" as "entry" | "work_station",
    warehouse: "",
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Istasyon</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) return;
            onSave({
              name: form.name,
              type: form.type,
              warehouse: form.warehouse || null,
              display_url: null,
            });
            setForm({ name: "", type: "entry", warehouse: "" });
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <Label>Istasyon Adi *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Depo A Giris Kapisi"
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Tur *</Label>
            <Select
              value={form.type}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  type: v as "entry" | "work_station",
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Giris Kapisi</SelectItem>
                <SelectItem value="work_station">Is Istasyonu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Depo (opsiyonel)</Label>
            <Input
              value={form.warehouse}
              onChange={(e) =>
                setForm({ ...form, warehouse: e.target.value })
              }
              placeholder="Depo A"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Iptal
            </Button>
            <Button type="submit" className="bg-[#007FE2] hover:bg-[#0066b8]">
              Olustur
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
