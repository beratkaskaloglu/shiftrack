"use client";

import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, ClipboardList, Megaphone } from "lucide-react";
import { MOCK_USERS, MOCK_SHIFTS, MOCK_WORK_ASSIGNMENTS, MOCK_ANNOUNCEMENTS } from "@/lib/mock-data";

const STATS = [
  {
    title: "Toplam Personel",
    value: MOCK_USERS.length,
    icon: Users,
    color: "text-[#007FE2]",
    bg: "bg-[#007FE2]/10",
  },
  {
    title: "Aktif Vardiya",
    value: MOCK_SHIFTS.length,
    icon: Clock,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Aktif Gorevler",
    value: MOCK_WORK_ASSIGNMENTS.filter((a) => a.status !== "completed").length,
    icon: ClipboardList,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Aktif Duyurular",
    value: MOCK_ANNOUNCEMENTS.filter((a) => a.is_active).length,
    icon: Megaphone,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Hosgeldiniz, ${user?.full_name}`}
        description="ShiftTrack Admin Portal"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-[#007FE2]" />
              Son Gorev Atamalari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_WORK_ASSIGNMENTS.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.task_name}
                    </p>
                    <p className="text-xs text-gray-500">{a.personnel_name}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-purple-600" />
              Son Duyurular
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_ANNOUNCEMENTS.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(a.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {a.is_active ? "Aktif" : "Pasif"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
  };
  const labels: Record<string, string> = {
    pending: "Bekliyor",
    in_progress: "Devam Ediyor",
    completed: "Tamamlandi",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        styles[status] || styles.pending
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
