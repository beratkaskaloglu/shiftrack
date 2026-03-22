# ShiftTrack

**Shift & Workforce Tracking System**

Lojistik depolarında çalışan mavi yaka personelinin vardiya, check-in ve iş görevi takibini tek platformda yöneten sistem. QR kod tabanlı giriş ve iş istasyonu takibi ile çalışır.

---

## Sistem Mimarisi

```
┌─────────────────────────────────────────────┐
│  user-app/          → Personel Uygulaması   │  :3001
│  admin-portal/      → Yönetim Paneli        │  :3002
│  qr-system/api/     → QR Token API          │  :8000
│  qr-system/station-display/ → İstasyon Ekranı│ :3003
└─────────────────────────────────────────────┘
         │
    PostgreSQL :5432
```

---

## Hızlı Kurulum

> Detaylı kurulum için: [SETUP.md](SETUP.md)

### Ön Koşullar

| Araç | Minimum Sürüm |
|------|--------------|
| Node.js | 18+ |
| Python | 3.10+ |
| PostgreSQL | 14+ |
| Cloudflare Tunnel | Herhangi |

### 1. Repoyu Klonla

```bash
git clone https://github.com/KULLANICI_ADI/shifttrack.git
cd shifttrack
```

### 2. Veritabanı Kur

```bash
psql -c "CREATE DATABASE shifttrack;"
psql -c "CREATE USER shifttrack_user WITH PASSWORD 'shifttrack123';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE shifttrack TO shifttrack_user;"
psql -d shifttrack -c "GRANT ALL ON SCHEMA public TO shifttrack_user;"
```

### 3. Environment Dosyalarını Oluştur

```bash
# User App
cp user-app/.env.example user-app/.env

# QR API
cp qr-system/api/.env.example qr-system/api/.env
```

### 4. Bağımlılıkları Yükle

```bash
# User App
cd user-app && npm install && npx prisma db push && npx prisma db seed && cd ..

# Station Display
cd qr-system/station-display && npm install && cd ../..

# Admin Portal
cd admin-portal && npm install && cd ..

# QR API (Python)
cd qr-system/api && pip install -r requirements.txt && cd ../..
```

---

## Sistemi Başlat

Her komut **ayrı terminal** sekmesinde çalıştırılır:

```bash
# Terminal 1 — QR Token API
cd qr-system/api && uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — User App
cd user-app && npm run dev -- -p 3001

# Terminal 3 — Station Display
cd qr-system/station-display && npm run dev -- -p 3003

# Terminal 4 — Admin Portal
cd admin-portal && npm run dev -- -p 3002

# Terminal 5 — iPad/Mobil Erişim (HTTPS tunnel)
cloudflared tunnel --url http://localhost:3001
```

---

## Servis Adresleri

| Servis | Adres |
|--------|-------|
| User App (Personel) | http://localhost:3001 |
| Admin Portal | http://localhost:3002 |
| QR Token API | http://localhost:8000 |
| API Dokümantasyonu | http://localhost:8000/docs |
| İstasyon Ekranı (DEPO A) | http://localhost:3003/station/fe07a719-cd18-4405-86c5-9942ad3da150 |
| iPad / Mobil | Terminal 5'teki `https://xxx.trycloudflare.com` |

---

## Giriş Bilgileri (Test)

| Kullanıcı | Şifre | Kullanım |
|-----------|-------|----------|
| `recep.ulu` | `recep123` | User App — test personeli |
| `admin` | `admin123` | Admin Portal |

---

## QR Akışı Nasıl Çalışır?

```
1. Station Display ekranda QR gösterir (her okutmada otomatik yenilenir)
2. Personel telefonuyla cloudflare URL'e girer → User App açılır
3. Check-In sayfasına gider → Kamerayı Aç
4. QR kodu okur → Check-in kaydedilir → Yeni QR otomatik oluşur
```

---

## Proje Yapısı

```
shifttrack/
├── user-app/                   # Next.js PWA — personel uygulaması
│   ├── src/app/                # Sayfalar (login, dashboard, check-in, work)
│   ├── src/qr/                 # QR tarama modülü
│   ├── prisma/schema.prisma    # Veritabanı şeması
│   └── .env.example
├── admin-portal/               # Next.js — yönetim paneli
│   └── src/app/
├── qr-system/
│   ├── api/                    # FastAPI — QR token servisi
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── .env.example
│   └── station-display/        # Next.js — istasyon QR ekranı
├── README.md                   # Bu dosya
├── SETUP.md                    # Detaylı kurulum rehberi
├── opening.md                  # Günlük başlatma komutları
└── ml-dl-altyapi.md            # ML/DL altyapı dokümantasyonu
```

---

## Teknik Stack

| Katman | Teknoloji |
|--------|-----------|
| Personel Uygulaması | Next.js 14, TypeScript, Tailwind CSS, Zustand, Prisma |
| Admin Portal | Next.js 14, shadcn/ui, TanStack Table, Recharts |
| QR API | Python FastAPI, SQLAlchemy, PostgreSQL |
| Veritabanı | PostgreSQL 14+ |
| QR Okuma | jsQR, BarcodeDetector API |
| Mobil Erişim | Cloudflare Tunnel (HTTPS) |
