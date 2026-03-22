"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  MOCK_EFFICIENCY_SCORES,
  MOCK_ANOMALIES,
  MOCK_TREND_DATA,
} from "@/lib/mock-data";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";

const SEVERITY_STYLES: Record<string, { label: string; class: string }> = {
  low: { label: "Dusuk", class: "bg-gray-100 text-gray-600" },
  medium: { label: "Orta", class: "bg-amber-100 text-amber-700" },
  high: { label: "Yuksek", class: "bg-red-100 text-red-700" },
};

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  late_arrival: "Gec Giris",
  early_departure: "Erken Cikis",
  long_break: "Uzun Mola",
  low_efficiency: "Dusuk Verimlilik",
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  up: <ArrowUp className="h-4 w-4 text-green-600" />,
  down: <ArrowDown className="h-4 w-4 text-red-600" />,
  stable: <Minus className="h-4 w-4 text-gray-400" />,
};

const PIE_COLORS = ["#007FE2", "#22C55E", "#F97316", "#D11A4C", "#0BBBE4"];

export default function ReportsPage() {
  // Radar chart data from efficiency scores
  const radarData = MOCK_EFFICIENCY_SCORES.map((e) => ({
    name: e.personnel_name.split(" ")[0],
    score: e.score,
  }));

  // Pie chart - anomaly distribution by type
  const anomalyByType = Object.entries(
    MOCK_ANOMALIES.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({
    name: ANOMALY_TYPE_LABELS[type] || type,
    value: count,
  }));

  // Bar chart - efficiency by project
  const efficiencyByProject = Object.entries(
    MOCK_EFFICIENCY_SCORES.reduce<Record<string, { total: number; count: number }>>(
      (acc, e) => {
        if (!acc[e.project]) acc[e.project] = { total: 0, count: 0 };
        acc[e.project].total += e.score;
        acc[e.project].count += 1;
        return acc;
      },
      {}
    )
  ).map(([project, { total, count }]) => ({
    project,
    average: Math.round(total / count),
  }));

  return (
    <div>
      <PageHeader
        title="ML/DL Raporlar"
        description="Verimlilik skorlari, anomali tespiti, trend grafikleri"
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Genel Bakis
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trend Analizi
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Anomaliler
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="gap-2">
            <Activity className="h-4 w-4" />
            Verimlilik
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ──────────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">Ort. Verimlilik</p>
                <p className="text-3xl font-bold text-[#007FE2] mt-1">
                  {Math.round(
                    MOCK_EFFICIENCY_SCORES.reduce((s, e) => s + e.score, 0) /
                      MOCK_EFFICIENCY_SCORES.length
                  )}
                  %
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">Toplam Anomali</p>
                <p className="text-3xl font-bold text-red-500 mt-1">
                  {MOCK_ANOMALIES.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">Yukselis Trendi</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {MOCK_EFFICIENCY_SCORES.filter((e) => e.trend === "up").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">Dusus Trendi</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">
                  {MOCK_EFFICIENCY_SCORES.filter((e) => e.trend === "down")
                    .length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Project efficiency bar chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Proje Bazli Verimlilik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={efficiencyByProject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="project" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#007FE2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Anomaly distribution pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Anomali Dagilimi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={anomalyByType}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }: any) =>
                        `${name || ""} ${((percent || 0) * 100).toFixed(0)}%`
                      }
                    >
                      {anomalyByType.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Trends ────────────────────────────────────────────────── */}
        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                30 Gunluk Trend Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={MOCK_TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                      })
                    }
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    labelFormatter={(v) =>
                      new Date(v).toLocaleDateString("tr-TR")
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    name="Verimlilik"
                    stroke="#007FE2"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    name="Devam"
                    stroke="#22C55E"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="task_completion"
                    name="Gorev Tamamlama"
                    stroke="#F97316"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Anomalies ─────────────────────────────────────────────── */}
        <TabsContent value="anomalies" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Personel
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Tip
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Ciddiyet
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Tespit Tarihi
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">
                    Detay
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_ANOMALIES.map((a) => {
                  const sev = SEVERITY_STYLES[a.severity];
                  return (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {a.personnel_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {ANOMALY_TYPE_LABELS[a.type] || a.type}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${sev.class}`}
                        >
                          {sev.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(a.detected_at).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {a.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Efficiency ────────────────────────────────────────────── */}
        <TabsContent value="efficiency" className="mt-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Radar chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Personel Karsilastirmasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar
                      name="Skor"
                      dataKey="score"
                      stroke="#007FE2"
                      fill="#007FE2"
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Score cards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Verimlilik Skorlari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_EFFICIENCY_SCORES.map((e) => (
                    <div
                      key={e.personnel_id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {e.personnel_name}
                        </p>
                        <p className="text-xs text-gray-500">{e.project}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#007FE2]"
                            style={{ width: `${e.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-10 text-right">
                          {e.score}
                        </span>
                        {TREND_ICONS[e.trend]}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
