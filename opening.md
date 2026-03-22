# ShiftTrack — Sistemi Başlatma Kılavuzu

Her servis için ayrı terminal sekmesi açılır. Sırayla başlatılır.

---

## Ön Koşul — PostgreSQL

PostgreSQL çalışıyor olmalı. Kontrol:

```bash
pg_isready
```

Çalışmıyorsa:

```bash
brew services start postgresql@14
```

---

## Terminal 1 — QR Token API (FastAPI)

```bash
lsof -ti:8000 | xargs kill -9 2>/dev/null; cd /Users/berat/Projects/arvato/shifttrack/qr-system/api && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Başarılı mesaj: `Application startup complete.`

---

## Terminal 2 — User App (Next.js)

```bash
cd /Users/berat/Projects/arvato/shifttrack/user-app && npm run dev -- -p 3001
```

Başarılı mesaj: `Ready in ...ms`

---

## Terminal 3 — Station Display (Next.js)

```bash
cd /Users/berat/Projects/arvato/shifttrack/qr-system/station-display && npm run dev -- -p 3003
```

---

## Terminal 4 — Admin Portal (Next.js)

```bash
cd /Users/berat/Projects/arvato/shifttrack/admin-portal && npm run dev -- -p 3002
```

---

## Terminal 5 — iPad / Mobil Erişim (Cloudflare Tunnel)

```bash
cloudflared tunnel --url http://localhost:3001
```

Çıktıdaki `https://xxx.trycloudflare.com` URL'si iPad'de açılır.

> Not: Her başlatmada URL değişir. Tunnel kapatılıp açılırsa yeni URL oluşur.

---

## Servis Adresleri

| Servis | URL |
|--------|-----|
| User App | http://localhost:3001 |
| Admin Portal | http://localhost:3002 |
| QR Token API | http://localhost:8000 |
| QR API Docs | http://localhost:8000/docs |
| DEPO A Giriş Kapısı | http://localhost:3003/station/fe07a719-cd18-4405-86c5-9942ad3da150 |

---

## Giriş Bilgileri

| Kullanıcı | Şifre | Rol |
|-----------|-------|-----|
| `recep.ulu` | `recep123` | Personel (User App) |
| `admin` | `admin123` | Süper Admin (Admin Portal) |

---

## QR Sistemi Test Akışı

1. **Terminal 3 (Station Display)** çalışıyor olmalı
2. Tarayıcıda `http://localhost:3003/station/fe07a719-cd18-4405-86c5-9942ad3da150` aç
3. QR kodu ekranda görünmeli
4. iPad/telefonda cloudflare URL ile User App'e gir
5. `recep.ulu` / `recep123` ile giriş yap
6. **Check-In** sayfasına git → **Kamerayı Aç**
7. QR kodu oku → Check-in kaydedilmeli

---

## Sorun Giderme

### Port zaten kullanımda

```bash
lsof -ti:PORT | xargs kill -9
# Örnek: lsof -ti:8000 | xargs kill -9
```

### API başlamıyor

```bash
curl -s http://localhost:8000/health
# {"status":"ok"} dönmeli
```

### Kamera açılmıyor (iPad)

- Safari veya Chrome kullan
- HTTPS (cloudflare URL) üzerinden eriş — `localhost` üzerinden kamera açılmaz
- Safari: Ayarlar → Safari → Kamera → İzin Ver
- Sayfayı hard-refresh yap: `Cmd+Shift+R`

### CORS hatası

`qr-system/api/.env` içinde `CORS_ORIGINS` satırını kontrol et:

```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
```

Değişiklik sonrası API yeniden başlatılmalı.
