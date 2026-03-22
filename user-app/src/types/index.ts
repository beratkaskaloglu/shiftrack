// ── API Response Wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: UserProfile;
  token: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  checkAuth: () => Promise<void>;
}

// ── User / Personnel ─────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  platform: string;
  project: string;
  personnelNo?: string;
  avatarUrl?: string;
  role: "personnel" | "supervisor";
  isActive: boolean;
}

// ── Shift ────────────────────────────────────────────────────────────────────

export type ShiftType = "A" | "B" | "C";

export interface Shift {
  id: string;
  name: string;
  type: ShiftType;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  project: string;
}

export interface ShiftAssignment {
  id: string;
  personnelId: string;
  shiftId: string;
  shift: Shift;
  startDate: string; // ISO date
  endDate?: string;
}

export interface CurrentShift {
  shift: Shift;
  assignment: ShiftAssignment;
  isActive: boolean;
}

// ── Attendance ───────────────────────────────────────────────────────────────

export type AttendanceStatus = "working" | "leave" | "holiday" | "absent";

export interface AttendanceDay {
  date: string; // ISO date
  status: AttendanceStatus;
  turnstileEntry?: string; // ISO datetime
  turnstileExit?: string;
}

export interface AttendanceSummary {
  month: number;
  year: number;
  workingDays: number;
  leaveDays: number;
  holidayDays: number;
  absentDays: number;
  days: AttendanceDay[];
}

// ── Weekly Performance ───────────────────────────────────────────────────────

export interface WeeklyPerformanceDay {
  date: string;
  dayName: string; // Pzt, Sal, etc.
  turnstileHours: number;
  activityHours: number;
  isWorkDay: boolean;
}

export interface WeeklyPerformance {
  weekStartDate: string;
  weekEndDate: string;
  platform: string;
  project: string;
  shift: Shift;
  days: WeeklyPerformanceDay[];
  totalTurnstileHours: number;
  totalActivityHours: number;
}

// ── Work Task ────────────────────────────────────────────────────────────────

export type WorkTaskStatus = "pending" | "in_progress" | "completed";
export type WorkTaskPriority = "low" | "medium" | "high";

export interface WorkTask {
  id: string;
  name: string;
  description?: string;
  stationId: string;
  stationName: string;
  priority: WorkTaskPriority;
  status: WorkTaskStatus;
  expectedDuration: number; // minutes
  actualDuration?: number;
  startedAt?: string;
  completedAt?: string;
  assignedAt: string;
}

// ── Check-In ─────────────────────────────────────────────────────────────────

export interface CheckInRecord {
  id: string;
  personnelId: string;
  stationId: string;
  stationName: string;
  stationType: "entry" | "work_station";
  checkedInAt: string; // ISO datetime
}

export interface CheckInHistory {
  month: number;
  year: number;
  records: CheckInRecord[];
}

// ── Announcement ─────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  isActive: boolean;
}

// ── Station ──────────────────────────────────────────────────────────────────

export interface Station {
  id: string;
  name: string;
  type: "entry" | "work_station";
  warehouse?: string;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardData {
  currentShift: CurrentShift | null;
  announcements: Announcement[];
  todayCheckIn: CheckInRecord | null;
  quickLinks: QuickLink[];
}

export interface QuickLink {
  id: string;
  label: string;
  icon: string;
  url: string;
  type: "internal" | "iframe" | "external";
}

// ── Embedded App (iframe) ────────────────────────────────────────────────────

export interface EmbeddedApp {
  id: string;
  name: string;
  url: string;
  iconUrl?: string;
  type: "iframe" | "deeplink";
}

// ── Turnstile / Activity (from Local Data API) ───────────────────────────────

export interface TurnstileLog {
  id: string;
  personnelId: string;
  entryTime: string;
  exitTime?: string;
  stationName: string;
}

export interface ActivityLog {
  id: string;
  personnelId: string;
  date: string;
  totalActivityMinutes: number;
  stationName: string;
}
