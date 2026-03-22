// ── Core domain types ────────────────────────────────────────────────────────

export type UserRole = "super_admin" | "project_manager" | "supervisor";

export interface User {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  platform: string;
  project: string;
  personnel_no: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  platform: string;
  project: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ── Shift ────────────────────────────────────────────────────────────────────

export type ShiftType = "A" | "B" | "C";

export interface Shift {
  id: string;
  name: string;
  type: ShiftType;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  project: string;
  created_at: string;
}

export interface ShiftAssignment {
  id: string;
  shift_id: string;
  shift_name: string;
  personnel_id: string;
  personnel_name: string;
  start_date: string;
  end_date: string | null;
}

// ── Station & QR ─────────────────────────────────────────────────────────────

export interface Station {
  id: string;
  name: string;
  type: "entry" | "work_station";
  warehouse: string | null;
  display_url: string | null;
  created_at: string;
}

export interface QRToken {
  id: string;
  station_id: string;
  station_name: string;
  token: string;
  used: boolean;
  created_at: string;
  used_at: string | null;
  expires_at: string;
  status: "active" | "used" | "expired";
}

// ── Work Task ────────────────────────────────────────────────────────────────

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface WorkTask {
  id: string;
  name: string;
  description: string;
  station_id: string | null;
  station_name: string | null;
  target_duration_minutes: number;
  priority: TaskPriority;
  created_at: string;
}

export interface WorkAssignment {
  id: string;
  task_id: string;
  task_name: string;
  personnel_id: string;
  personnel_name: string;
  station_name: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  target_duration_minutes: number;
  actual_duration_minutes: number | null;
  started_at: string | null;
  completed_at: string | null;
  assigned_at: string;
}

// ── Announcement ─────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── ML/DL Reports ────────────────────────────────────────────────────────────

export interface EfficiencyScore {
  personnel_id: string;
  personnel_name: string;
  project: string;
  score: number;
  trend: "up" | "down" | "stable";
  period: string;
}

export interface AnomalyRecord {
  id: string;
  personnel_name: string;
  type: "late_arrival" | "early_departure" | "long_break" | "low_efficiency";
  severity: "low" | "medium" | "high";
  detected_at: string;
  details: string;
}

export interface TrendDataPoint {
  date: string;
  efficiency: number;
  attendance: number;
  task_completion: number;
}
