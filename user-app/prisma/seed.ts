/**
 * Prisma seed — ShiftTrack demo data
 * Run: npx prisma db seed
 *
 * Includes:
 *  - admin user (admin / admin123)
 *  - Recep Ulu test personnel (recep.ulu / recep123)
 *  - SEPHORA shifts, stations, work tasks, checkin logs
 *  - QR station (Depo A)
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── Personnel ──────────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash("admin123", 10);
  const recepHash = await bcrypt.hash("recep123", 10);

  await prisma.personnel.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      username: "admin",
      password: adminHash,
      firstName: "Sistem",
      lastName: "Yöneticisi",
      email: "admin@arvato.com",
      platform: "PX",
      project: "ARVATO",
      role: "supervisor",
      isActive: true,
    },
  });

  await prisma.personnel.upsert({
    where: { username: "recep.ulu" },
    update: {},
    create: {
      id: "2cc1dbb0-a801-433b-9dd8-b2123927ce74",
      username: "recep.ulu",
      password: recepHash,
      firstName: "Recep",
      lastName: "Ulu",
      email: "recep.ulu@arvato.com",
      phone: "5333156881",
      platform: "PX",
      project: "SEPHORA",
      personnelNo: "ARV-2847",
      role: "personnel",
      isActive: true,
    },
  });

  // ── Shifts ─────────────────────────────────────────────────────────────────

  await prisma.shift.createMany({
    skipDuplicates: true,
    data: [
      { id: "aaaaaaaa-0001-0001-0001-000000000001", name: "SEPHORA VARDIYA A", type: "A", startTime: "07:30", endTime: "16:30", project: "SEPHORA" },
      { id: "aaaaaaaa-0001-0001-0001-000000000002", name: "SEPHORA VARDIYA B", type: "B", startTime: "16:30", endTime: "01:30", project: "SEPHORA" },
      { id: "aaaaaaaa-0001-0001-0001-000000000003", name: "SEPHORA VARDIYA C", type: "C", startTime: "01:30", endTime: "09:30", project: "SEPHORA" },
    ],
  });

  // ── Shift Assignments (March 2026) ─────────────────────────────────────────

  const shiftDays = [
    "2026-03-02","2026-03-03","2026-03-04","2026-03-05","2026-03-06",
    "2026-03-09","2026-03-10","2026-03-11","2026-03-12","2026-03-13",
    "2026-03-16","2026-03-17","2026-03-18","2026-03-19","2026-03-20",
    "2026-03-23","2026-03-24","2026-03-25","2026-03-26","2026-03-27",
    "2026-03-30","2026-03-31",
  ];

  for (const day of shiftDays) {
    await prisma.shiftAssignment.upsert({
      where: { id: `shift-${day}` },
      update: {},
      create: {
        id: `shift-${day}`,
        personnelId: "2cc1dbb0-a801-433b-9dd8-b2123927ce74",
        shiftId: "aaaaaaaa-0001-0001-0001-000000000001",
        startDate: new Date(day),
      },
    });
  }

  // ── Stations ───────────────────────────────────────────────────────────────

  await prisma.station.createMany({
    skipDuplicates: true,
    data: [
      { id: "bbbbbbbb-0001-0001-0001-000000000001", name: "Depo A Giriş Kapısı", type: "entry", warehouse: "Arvato Gebze" },
      { id: "bbbbbbbb-0001-0001-0001-000000000002", name: "Sephora Paketleme İstasyonu", type: "work_station", warehouse: "Arvato Gebze" },
      { id: "bbbbbbbb-0001-0001-0001-000000000003", name: "Sephora Toplama İstasyonu", type: "work_station", warehouse: "Arvato Gebze" },
      { id: "bbbbbbbb-0001-0001-0001-000000000004", name: "Sephora Etiketleme Bandı", type: "work_station", warehouse: "Arvato Gebze" },
    ],
  });

  // ── Work Tasks ─────────────────────────────────────────────────────────────

  await prisma.workTask.createMany({
    skipDuplicates: true,
    data: [
      { id: "cccccccc-0001-0001-0001-000000000001", name: "Sipariş Toplama", description: "Raflardan sipariş kalemlerinin toplanması", stationId: "bbbbbbbb-0001-0001-0001-000000000003", priority: "high", expectedDuration: 90 },
      { id: "cccccccc-0001-0001-0001-000000000002", name: "Paket Hazırlama", description: "Toplanan ürünlerin paketlenmesi ve bantlanması", stationId: "bbbbbbbb-0001-0001-0001-000000000002", priority: "high", expectedDuration: 120 },
      { id: "cccccccc-0001-0001-0001-000000000003", name: "Ürün Etiketleme", description: "Yeni gelen ürünlerin barkod etiketlenmesi", stationId: "bbbbbbbb-0001-0001-0001-000000000004", priority: "medium", expectedDuration: 60 },
      { id: "cccccccc-0001-0001-0001-000000000004", name: "Stok Sayımı", description: "Haftalık stok kontrol ve sayım işlemi", stationId: "bbbbbbbb-0001-0001-0001-000000000002", priority: "low", expectedDuration: 180 },
      { id: "cccccccc-0001-0001-0001-000000000005", name: "İade Kontrolü", description: "İade ürünlerin kontrolü ve sisteme girişi", stationId: "bbbbbbbb-0001-0001-0001-000000000004", priority: "medium", expectedDuration: 45 },
    ],
  });

  // ── Check-In Logs (March 2026) ─────────────────────────────────────────────

  const checkinDates = [
    { date: "2026-03-02", time: "07:25" }, { date: "2026-03-03", time: "07:27" },
    { date: "2026-03-04", time: "07:29" }, { date: "2026-03-05", time: "07:28" },
    { date: "2026-03-06", time: "07:27" }, { date: "2026-03-09", time: "07:32" },
    { date: "2026-03-10", time: "07:27" }, { date: "2026-03-11", time: "07:34" },
    { date: "2026-03-12", time: "07:33" }, { date: "2026-03-13", time: "07:33" },
    { date: "2026-03-16", time: "07:26" }, { date: "2026-03-17", time: "07:31" },
    { date: "2026-03-18", time: "07:31" }, { date: "2026-03-19", time: "07:30" },
    { date: "2026-03-20", time: "07:30" },
  ];

  for (const { date, time } of checkinDates) {
    await prisma.checkinLog.upsert({
      where: { id: `checkin-${date}` },
      update: {},
      create: {
        id: `checkin-${date}`,
        personnelId: "2cc1dbb0-a801-433b-9dd8-b2123927ce74",
        stationId: "bbbbbbbb-0001-0001-0001-000000000001",
        stationType: "entry",
        checkedInAt: new Date(`${date}T${time}:00`),
      },
    });
  }

  // ── Work Assignments ───────────────────────────────────────────────────────

  await prisma.workAssignment.createMany({
    skipDuplicates: true,
    data: [
      { id: "wa-active-001", personnelId: "2cc1dbb0-a801-433b-9dd8-b2123927ce74", workTaskId: "cccccccc-0001-0001-0001-000000000001", status: "in_progress", startedAt: new Date("2026-03-22T08:05:00"), assignedAt: new Date("2026-03-22T07:45:00") },
      { id: "wa-active-002", personnelId: "2cc1dbb0-a801-433b-9dd8-b2123927ce74", workTaskId: "cccccccc-0001-0001-0001-000000000002", status: "in_progress", startedAt: new Date("2026-03-22T09:30:00"), assignedAt: new Date("2026-03-22T07:45:00") },
      { id: "wa-done-001", personnelId: "2cc1dbb0-a801-433b-9dd8-b2123927ce74", workTaskId: "cccccccc-0001-0001-0001-000000000001", status: "completed", startedAt: new Date("2026-03-21T07:42:00"), completedAt: new Date("2026-03-21T09:11:00"), assignedAt: new Date("2026-03-21T07:35:00") },
      { id: "wa-done-002", personnelId: "2cc1dbb0-a801-433b-9dd8-b2123927ce74", workTaskId: "cccccccc-0001-0001-0001-000000000003", status: "completed", startedAt: new Date("2026-03-21T09:20:00"), completedAt: new Date("2026-03-21T10:15:00"), assignedAt: new Date("2026-03-21T07:35:00") },
      { id: "wa-done-003", personnelId: "2cc1dbb0-a801-433b-9dd8-b2123927ce74", workTaskId: "cccccccc-0001-0001-0001-000000000002", status: "completed", startedAt: new Date("2026-03-20T07:50:00"), completedAt: new Date("2026-03-20T10:02:00"), assignedAt: new Date("2026-03-20T07:40:00") },
      { id: "wa-done-004", personnelId: "2cc1dbb0-a801-433b-9dd8-b2123927ce74", workTaskId: "cccccccc-0001-0001-0001-000000000005", status: "completed", startedAt: new Date("2026-03-20T10:15:00"), completedAt: new Date("2026-03-20T11:05:00"), assignedAt: new Date("2026-03-20T07:40:00") },
      { id: "wa-done-005", personnelId: "2cc1dbb0-a801-433b-9dd8-b2123927ce74", workTaskId: "cccccccc-0001-0001-0001-000000000004", status: "completed", startedAt: new Date("2026-03-19T13:00:00"), completedAt: new Date("2026-03-19T16:10:00"), assignedAt: new Date("2026-03-19T07:40:00") },
    ],
  });

  // ── Announcements ──────────────────────────────────────────────────────────

  await prisma.announcement.createMany({
    skipDuplicates: true,
    data: [
      { id: "ann-001", title: "Gebze Depo Bahar Temizliği — 28 Mart", content: "Depo içi temizlik nedeniyle 28 Mart Cumartesi bakım çalışması yapılacaktır. Tüm personel bilgilendirilmelidir.", isActive: true, createdAt: new Date("2026-03-20T09:00:00") },
      { id: "ann-002", title: "Sephora Q2 Hedefleri Açıklandı", content: "2026 Q2 dönemine ait operasyonel hedefler proje yönetimi tarafından duyurulmuştur. Detaylar IK portalında mevcuttur.", isActive: true, createdAt: new Date("2026-03-18T10:30:00") },
      { id: "ann-003", title: "Yeni Güvenlik Prosedürleri — Zorunlu Okuma", content: "Depo güvenlik prosedürleri güncellendi. Tüm personelin 25 Mart tarihine kadar okuması ve onaylaması gerekmektedir.", isActive: true, createdAt: new Date("2026-03-15T08:00:00") },
      { id: "ann-004", title: "Ramazan Mesai Düzenlemesi", content: "Ramazan ayı süresince vardiya saatlerinde düzenleme yapılacaktır. Güncel çizelge için süpervizörünüze danışın.", isActive: true, createdAt: new Date("2026-03-10T09:00:00") },
    ],
  });

  console.log("Seed complete.");
  console.log("  recep.ulu / recep123  → User App");
  console.log("  admin / admin123      → Admin Portal");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
