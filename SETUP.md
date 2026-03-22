# ShiftTrack — Kurulum Rehberi

Bu rehber, ShiftTrack sistemini sıfırdan kurarak tüm servisleri ayağa kaldırır.

> **Veritabanı:** Sistem şirket SQL Server'ını kullanır. PostgreSQL kurmanıza gerek yoktur.

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

# Cloudflare Tunnel
brew install cloudflared
```

### Windows

1. **Node.js 18+** → https://nodejs.org adresinden indir, kur
2. **Python 3.11+** → https://python.org adresinden indir, kur ("Add to PATH" kutusunu işaretle)
3. **Cloudflare Tunnel** → https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation adresinden indir

### Sürüm Kontrolü

```bash
node --version      # v18.0.0 veya üzeri olmalı
python3 --version   # 3.10.0 veya üzeri olmalı
cloudflared --version
```

---

## 2. Repoyu Klonla

```bash
git clone https://github.com/beratkaskaloglu/shiftrack.git
cd shiftrack
```

---

## 3. SQL Server — Veritabanı Oluştur

Şirket SQL Server'ında aşağıdaki komutu çalıştırın (IT veya DBA yapabilir):

```sql
CREATE DATABASE shifttrack;
```

Veritabanı adı farklıysa kurulum sırasında o ismi girin.

---

## 4. Kurulum Scriptini Çalıştır

Script bağlantı bilgilerini soracak ve tüm adımları otomatik yapacak.

### macOS / Linux

```bash
bash setup.sh
```

> macOS'ta script çalışmazsa önce şunu dene:
> ```bash
> chmod +x setup.sh && ./setup.sh
> ```

### Windows (PowerShell)

PowerShell'i **yönetici olarak** aç, önce izin ver:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Sonra scripti çalıştır:

```powershell
.\setup.ps1
```

Script şunları sorar:

```
  Server adresi (örn: 192.168.1.10):
  Port [1433]:
  Kullanici adi:
  Sifre:
  Veritabani adi:
```

Bilgileri girin — geri kalan her şeyi (`.env` dosyaları, `npm install`, `prisma db push`, demo verisi) script otomatik yapar.

---

## 5. Sistemi Başlat

Her komut **ayrı terminal** sekmesinde çalıştırılır.

### Terminal 1 — QR Token API

```bash
cd shiftrack/qr-system/api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Başarılı: `Application startup complete.`
Kontrol: http://localhost:8000/health → `{"status":"ok"}` dönmeli

### Terminal 2 — User App

```bash
cd shiftrack/user-app
npm run dev -- -p 3001
```

Başarılı: `Ready in ...ms`
Aç: http://localhost:3001

### Terminal 3 — Station Display

```bash
cd shiftrack/qr-system/station-display
npm run dev -- -p 3003
```

### Terminal 4 — Admin Portal

```bash
cd shiftrack/admin-portal
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

## 6. Giriş Bilgileri

| Servis | Kullanıcı | Şifre |
|--------|-----------|-------|
| User App | `recep.ulu` | `recep123` |
| Admin Portal | `admin` | `admin123` |

---

## 7. Sorun Giderme

### SQL Server'a bağlanamıyor

- Server adresini ve portu kontrol et (varsayılan: 1433)
- SQL Server'da TCP/IP protokolü açık olmalı: SQL Server Configuration Manager → Protocols → TCP/IP → Enable
- Güvenlik duvarında 1433 portuna izin verilmeli

### Port zaten kullanımda

```bash
# macOS/Linux
lsof -ti:PORT | xargs kill -9
# Örnek: lsof -ti:8000 | xargs kill -9

# Windows (PowerShell)
netstat -ano | findstr :PORT
taskkill /PID PROCESS_ID /F
```

### `npm install` hata veriyor

```bash
# node_modules temizle ve yeniden yükle
rm -rf node_modules .next
npm install
```

### Python modülleri bulunamıyor

```bash
python3 -m pip install -r requirements.txt
```

### Kamera açılmıyor (iPad)

- Mutlaka `https://` URL'si kullan (cloudflare tunnel)
- `http://localhost` veya `http://192.168.x.x` üzerinden kamera açılmaz
- Safari: Ayarlar → Safari → Kamera → İzin Ver

### CORS hatası

`qr-system/api/.env` dosyasında `CORS_ORIGINS` satırını kontrol et:
```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
```
Değişiklik sonrası API yeniden başlatılmalı.

---

## 8. Günlük Kullanım

Sistem her gün açıldığında [opening.md](opening.md) dosyasındaki komutlar çalıştırılır.
