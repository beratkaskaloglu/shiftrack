import type {
  User,
  Shift,
  ShiftAssignment,
  WorkTask,
  WorkAssignment,
  Announcement,
  EfficiencyScore,
  AnomalyRecord,
  TrendDataPoint,
} from "./types";

// ── Users ────────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    username: "admin",
    full_name: "Berat Yilmaz",
    email: "berat@arvato.com",
    phone: "533 315 68 81",
    platform: "PX",
    project: "SEPHORA",
    personnel_no: "1001",
    role: "super_admin",
    is_active: true,
    created_at: "2024-01-15T08:00:00Z",
    updated_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "u2",
    username: "recep.ulu",
    full_name: "Recep Ulu",
    email: "recep@arvato.com",
    phone: "532 111 22 33",
    platform: "PX",
    project: "SEPHORA",
    personnel_no: "1002",
    role: "project_manager",
    is_active: true,
    created_at: "2024-02-01T08:00:00Z",
    updated_at: "2024-02-01T08:00:00Z",
  },
  {
    id: "u3",
    username: "ahmet.demir",
    full_name: "Ahmet Demir",
    email: "ahmet@arvato.com",
    phone: "535 444 55 66",
    platform: "PX",
    project: "SEPHORA",
    personnel_no: "1003",
    role: "supervisor",
    is_active: true,
    created_at: "2024-02-15T08:00:00Z",
    updated_at: "2024-02-15T08:00:00Z",
  },
  {
    id: "u4",
    username: "fatma.kaya",
    full_name: "Fatma Kaya",
    email: "fatma@arvato.com",
    phone: "536 777 88 99",
    platform: "ES",
    project: "ZARA",
    personnel_no: "2001",
    role: "supervisor",
    is_active: true,
    created_at: "2024-03-01T08:00:00Z",
    updated_at: "2024-03-01T08:00:00Z",
  },
  {
    id: "u5",
    username: "mehmet.ozcan",
    full_name: "Mehmet Ozcan",
    email: "mehmet@arvato.com",
    phone: "537 111 22 33",
    platform: "ES",
    project: "ZARA",
    personnel_no: "2002",
    role: "project_manager",
    is_active: false,
    created_at: "2024-03-10T08:00:00Z",
    updated_at: "2024-06-01T08:00:00Z",
  },
  {
    id: "u6",
    username: "ayse.celik",
    full_name: "Ayse Celik",
    email: "ayse@arvato.com",
    phone: "538 333 44 55",
    platform: "PX",
    project: "SEPHORA",
    personnel_no: "1004",
    role: "supervisor",
    is_active: true,
    created_at: "2024-04-01T08:00:00Z",
    updated_at: "2024-04-01T08:00:00Z",
  },
];

// Password: "admin123" for all mock users
export const MOCK_PASSWORD = "admin123";

// ── Shifts ───────────────────────────────────────────────────────────────────

export const MOCK_SHIFTS: Shift[] = [
  {
    id: "s1",
    name: "Sabah Vardiyasi",
    type: "A",
    start_time: "06:00",
    end_time: "14:00",
    project: "SEPHORA",
    created_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "s2",
    name: "Aksam Vardiyasi",
    type: "B",
    start_time: "14:00",
    end_time: "22:00",
    project: "SEPHORA",
    created_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "s3",
    name: "Gece Vardiyasi",
    type: "C",
    start_time: "22:00",
    end_time: "06:00",
    project: "SEPHORA",
    created_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "s4",
    name: "Sabah Vardiyasi",
    type: "A",
    start_time: "07:00",
    end_time: "15:00",
    project: "ZARA",
    created_at: "2024-02-01T08:00:00Z",
  },
];

export const MOCK_SHIFT_ASSIGNMENTS: ShiftAssignment[] = [
  {
    id: "sa1",
    shift_id: "s1",
    shift_name: "Sabah Vardiyasi (A)",
    personnel_id: "u3",
    personnel_name: "Ahmet Demir",
    start_date: "2024-03-01",
    end_date: null,
  },
  {
    id: "sa2",
    shift_id: "s2",
    shift_name: "Aksam Vardiyasi (B)",
    personnel_id: "u6",
    personnel_name: "Ayse Celik",
    start_date: "2024-03-01",
    end_date: null,
  },
  {
    id: "sa3",
    shift_id: "s4",
    shift_name: "Sabah Vardiyasi (A)",
    personnel_id: "u4",
    personnel_name: "Fatma Kaya",
    start_date: "2024-03-01",
    end_date: null,
  },
];

// ── Work Tasks ───────────────────────────────────────────────────────────────

export const MOCK_WORK_TASKS: WorkTask[] = [
  {
    id: "wt1",
    name: "Raf Duzenleme",
    description: "Depo A raf sistemlerinin yeniden duzenlenmesi",
    station_id: "st1",
    station_name: "Depo A - Istasyon 1",
    target_duration_minutes: 120,
    priority: "high",
    created_at: "2024-03-01T08:00:00Z",
  },
  {
    id: "wt2",
    name: "Paket Hazirlama",
    description: "Siparis paketlerinin hazirlanmasi",
    station_id: "st2",
    station_name: "Depo A - Istasyon 2",
    target_duration_minutes: 60,
    priority: "medium",
    created_at: "2024-03-01T08:00:00Z",
  },
  {
    id: "wt3",
    name: "Kalite Kontrol",
    description: "Urun kalite kontrol sureci",
    station_id: "st3",
    station_name: "Depo B - Kontrol",
    target_duration_minutes: 45,
    priority: "high",
    created_at: "2024-03-05T08:00:00Z",
  },
  {
    id: "wt4",
    name: "Envanter Sayimi",
    description: "Haftalik envanter sayimi",
    station_id: null,
    station_name: null,
    target_duration_minutes: 180,
    priority: "low",
    created_at: "2024-03-10T08:00:00Z",
  },
];

export const MOCK_WORK_ASSIGNMENTS: WorkAssignment[] = [
  {
    id: "wa1",
    task_id: "wt1",
    task_name: "Raf Duzenleme",
    personnel_id: "u3",
    personnel_name: "Ahmet Demir",
    station_name: "Depo A - Istasyon 1",
    status: "in_progress",
    priority: "high",
    target_duration_minutes: 120,
    actual_duration_minutes: 85,
    started_at: "2024-03-20T08:30:00Z",
    completed_at: null,
    assigned_at: "2024-03-20T08:00:00Z",
  },
  {
    id: "wa2",
    task_id: "wt2",
    task_name: "Paket Hazirlama",
    personnel_id: "u3",
    personnel_name: "Ahmet Demir",
    station_name: "Depo A - Istasyon 2",
    status: "completed",
    priority: "medium",
    target_duration_minutes: 60,
    actual_duration_minutes: 55,
    started_at: "2024-03-19T09:00:00Z",
    completed_at: "2024-03-19T09:55:00Z",
    assigned_at: "2024-03-19T08:00:00Z",
  },
  {
    id: "wa3",
    task_id: "wt3",
    task_name: "Kalite Kontrol",
    personnel_id: "u6",
    personnel_name: "Ayse Celik",
    station_name: "Depo B - Kontrol",
    status: "pending",
    priority: "high",
    target_duration_minutes: 45,
    actual_duration_minutes: null,
    started_at: null,
    completed_at: null,
    assigned_at: "2024-03-20T08:00:00Z",
  },
  {
    id: "wa4",
    task_id: "wt1",
    task_name: "Raf Duzenleme",
    personnel_id: "u4",
    personnel_name: "Fatma Kaya",
    station_name: "Depo A - Istasyon 1",
    status: "completed",
    priority: "high",
    target_duration_minutes: 120,
    actual_duration_minutes: 110,
    started_at: "2024-03-18T08:00:00Z",
    completed_at: "2024-03-18T09:50:00Z",
    assigned_at: "2024-03-18T07:30:00Z",
  },
];

// ── Announcements ────────────────────────────────────────────────────────────

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1",
    title: "Yeni Yemekhane Saatleri",
    content: "1 Nisan itibariyle yemekhane saatleri 11:30-13:30 olarak guncellenecektir.",
    image_url: null,
    is_active: true,
    created_by: "Berat Yilmaz",
    created_at: "2024-03-15T10:00:00Z",
    updated_at: "2024-03-15T10:00:00Z",
  },
  {
    id: "a2",
    title: "Is Guvenligi Egitimi",
    content: "Tum personelin 25 Mart tarihine kadar is guvenligi egitimini tamamlamasi gerekmektedir.",
    image_url: null,
    is_active: true,
    created_by: "Berat Yilmaz",
    created_at: "2024-03-10T08:00:00Z",
    updated_at: "2024-03-10T08:00:00Z",
  },
  {
    id: "a3",
    title: "Bayram Tatili Programi",
    content: "Ramazan Bayrami tatili 10-12 Nisan tarihleri arasinda uygulanacaktir.",
    image_url: null,
    is_active: false,
    created_by: "Recep Ulu",
    created_at: "2024-03-01T08:00:00Z",
    updated_at: "2024-03-05T08:00:00Z",
  },
];

// ── ML/DL Report Data ────────────────────────────────────────────────────────

export const MOCK_EFFICIENCY_SCORES: EfficiencyScore[] = [
  { personnel_id: "u3", personnel_name: "Ahmet Demir", project: "SEPHORA", score: 92, trend: "up", period: "2024-03" },
  { personnel_id: "u6", personnel_name: "Ayse Celik", project: "SEPHORA", score: 87, trend: "stable", period: "2024-03" },
  { personnel_id: "u4", personnel_name: "Fatma Kaya", project: "ZARA", score: 78, trend: "down", period: "2024-03" },
  { personnel_id: "u5", personnel_name: "Mehmet Ozcan", project: "ZARA", score: 65, trend: "down", period: "2024-03" },
];

export const MOCK_ANOMALIES: AnomalyRecord[] = [
  {
    id: "an1",
    personnel_name: "Mehmet Ozcan",
    type: "late_arrival",
    severity: "high",
    detected_at: "2024-03-20T08:45:00Z",
    details: "Son 5 gun icerisinde 3 kez gec giris tespit edildi",
  },
  {
    id: "an2",
    personnel_name: "Fatma Kaya",
    type: "low_efficiency",
    severity: "medium",
    detected_at: "2024-03-19T16:00:00Z",
    details: "Haftalik verimlilik skoru %15 dusus gosterdi",
  },
  {
    id: "an3",
    personnel_name: "Ahmet Demir",
    type: "long_break",
    severity: "low",
    detected_at: "2024-03-18T12:45:00Z",
    details: "Oglen molasi normalden 20 dakika uzun",
  },
];

export const MOCK_TREND_DATA: TrendDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2024, 2, i + 1);
  return {
    date: date.toISOString().slice(0, 10),
    efficiency: 75 + Math.round(Math.random() * 20),
    attendance: 85 + Math.round(Math.random() * 15),
    task_completion: 70 + Math.round(Math.random() * 25),
  };
});
