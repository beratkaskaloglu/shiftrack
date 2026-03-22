# ShiftTrack — Kurulum Rehberi

Bu rehber, ShiftTrack sistemini sıfırdan kurarak tüm servisleri ayağa kaldırır.

---

## 1. Sistem Gereksinimleri

### macOS

```bash
# Homebrew (yoksa kur)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js 18+
brew install node

# Python 3.10+
brew install python@3.11

# PostgreSQL 14+
brew install postgresql@14
brew services start postgresql@14

# Cloudflare Tunnel
brew install cloudflared
```

### Windows

1. **Node.js 18+** → https://nodejs.org adresinden indir, kur
2. **Python 3.11+** → https://python.org adresinden indir, kur ("Add to PATH" kutusunu işaretle)
3. **PostgreSQL 14+** → https://www.postgresql.org/download/windows adresinden indir, kur
4. **Cloudflare Tunnel** → https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation adresinden indir

### Sürüm Kontrolü

```bash
node --version      # v18.0.0 veya üzeri olmalı
python3 --version   # 3.10.0 veya üzeri olmalı
psql --version      # 14.0 veya üzeri olmalı
cloudflared --version
```

---

## 2. Repoyu Klonla

```bash
git clone https://github.com/KULLANICI_ADI/shifttrack.git
cd shifttrack
```

---

## 3. PostgreSQL Kurulumu

### macOS / Linux

```bash
# Veritabanı ve kullanıcı oluştur
psql -c "CREATE DATABASE shifttrack;"
psql -c "CREATE USER shifttrack_user WITH PASSWORD 'shifttrack123';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE shifttrack TO shifttrack_user;"
psql -d shifttrack -c "GRANT ALL ON SCHEMA public TO shifttrack_user;"
```

### Windows (PowerShell — PostgreSQL bin klasörü PATH'te olmalı)

```powershell
psql -U postgres -c "CREATE DATABASE shifttrack;"
psql -U postgres -c "CREATE USER shifttrack_user WITH PASSWORD 'shifttrack123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE shifttrack TO shifttrack_user;"
psql -U postgres -d shifttrack -c "GRANT ALL ON SCHEMA public TO shifttrack_user;"
```

---

## 4. Environment Dosyaları

### User App

```bash
cp user-app/.env.example user-app/.env
```

`user-app/.env` içeriği:

```env
DATABASE_URL="postgresql://shifttrack_user:shifttrack123@localhost:5432/shifttrack"
JWT_ACCESS_SECRET="shifttrack-access-secret-change-in-production"
JWT_REFRESH_SECRET="shifttrack-refresh-secret-change-in-production"
QR_TOKEN_API_URL="http://localhost:8000"
NEXT_PUBLIC_QR_API_URL="http://localhost:8000"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### QR Token API

```bash
cp qr-system/api/.env.example qr-system/api/.env
```

`qr-system/api/.env` içeriği:

```env
DATABASE_URL=postgresql+asyncpg://shifttrack_user:shifttrack123@localhost:5432/shifttrack
JWT_SECRET=shifttrack-dev-secret-2026
ENVIRONMENT=development
TOKEN_TTL_HOURS=24
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
```

---

## 5. Bağımlılıkları Yükle

### User App

```bash
cd user-app
npm install
npx prisma db push      # Veritabanı tablolarını oluştur
npx prisma db seed      # Test verisi ekle (Recep Ulu + admin)
cd ..
```

### Station Display

```bash
cd qr-system/station-display
npm install
cd ../..
```

### Admin Portal

```bash
cd admin-portal
npm install
cd ..
```

### QR Token API (Python)

```bash
cd qr-system/api
pip install -r requirements.txt
cd ../..
```

> **Not:** Python sanal ortam kullanmak istersen:
> ```bash
> cd qr-system/api
> python3 -m venv .venv
> source .venv/bin/activate   # Windows: .venv\Scripts\activate
> pip install -r requirements.txt
> cd ../..
> ```

---

## 6. Sistemi Başlat

Her komut **ayrı terminal** sekmesinde çalıştırılır.

### Terminal 1 — QR Token API

```bash
cd shifttrack/qr-system/api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Başarılı: `Application startup complete.`
Kontrol: http://localhost:8000/health → `{"status":"ok"}` dönmeli

### Terminal 2 — User App

```bash
cd shifttrack/user-app
npm run dev -- -p 3001
```

Başarılı: `Ready in ...ms`
Aç: http://localhost:3001

### Terminal 3 — Station Display

```bash
cd shifttrack/qr-system/station-display
npm run dev -- -p 3003
```

İstasyon QR ekranı:
http://localhost:3003/station/fe07a719-cd18-4405-86c5-9942ad3da150

### Terminal 4 — Admin Portal

```bash
cd shifttrack/admin-portal
npm run dev -- -p 3002
```

Aç: http://localhost:3002

### Terminal 5 — iPad / Mobil Erişim

```bash
cloudflared tunnel --url http://localhost:3001
```

Çıktıdaki `https://xxxx.trycloudflare.com` URL'si iPad'de açılır.

> Her başlatmada URL değişir. Tunnel kapatılıp açılırsa yeni URL oluşur.

---

## 7. Tüm Servisler Çalışıyor mu?

```bash
# QR API sağlık kontrolü
curl http://localhost:8000/health

# İstasyon token kontrolü
curl http://localhost:8000/tokens/station/fe07a719-cd18-4405-86c5-9942ad3da150/current
```

---

## 8. Giriş Bilgileri

| Servis | Kullanıcı | Şifre |
|--------|-----------|-------|
| User App | `recep.ulu` | `recep123` |
| Admin Portal | `admin` | `admin123` |

---

## 9. Sorun Giderme

### Port zaten kullanımda

```bash
# macOS/Linux
lsof -ti:PORT | xargs kill -9
# Örnek: lsof -ti:8000 | xargs kill -9

# Windows (PowerShell)
netstat -ano | findstr :PORT
taskkill /PID PROCESS_ID /F
```

### PostgreSQL bağlanamıyor

```bash
# PostgreSQL çalışıyor mu?
pg_isready

# macOS — başlat
brew services start postgresql@14

# Windows — Servisler > postgresql başlat
```

### `npm install` hata veriyor

```bash
# node_modules temizle ve yeniden yükle
rm -rf node_modules .next
npm install
```

### Python modülleri bulunamıyor

```bash
# pip'in doğru Python'a bağlı olduğunu kontrol et
python3 -m pip install -r requirements.txt
```

### Kamera açılmıyor (iPad)

- Mutlaka `https://` URL'si kullan (cloudflare tunnel)
- `http://localhost` veya `http://192.168.x.x` üzerinden kamera açılmaz
- Safari: Ayarlar → Safari → Kamera → İzin Ver
- Chrome: Adres çubuğundaki kilit ikonu → Kamera → İzin Ver

### CORS hatası

`qr-system/api/.env` dosyasında `CORS_ORIGINS` satırını kontrol et, tüm portlar listede olmalı:
```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
```
Değişiklik sonrası API yeniden başlatılmalı.

---

## 10. Günlük Kullanım

Sistem her gün açıldığında [opening.md](opening.md) dosyasındaki komutlar çalıştırılır.
