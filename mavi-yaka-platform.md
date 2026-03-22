# ShiftTrack — Proje Spesifikasyonu

**Shift & Workforce Tracking System**

> Lojistik depolarında çalışan mavi yaka personelinin şirket uygulamalarına erişimini tek bir platform üzerinden sağlamak.
> UX detayları için: `shifttrack-ux.md`

---

## Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────┐
│  PART 1 — User App (Next.js PWA)                                │
│  Mavi yaka personelinin kullandığı mobil öncelikli web uygulaması│
├─────────────────────────────────────────────────────────────────┤
│  PART 2 — Admin Portal (React)                                  │
│  Yöneticilerin sistemi yönettiği masaüstü panel                 │
├─────────────────────────────────────────────────────────────────┤
│  PART 3 — Local Data API (Python FastAPI)                       │
│  Sahada PC'de çalışan, turnike + iş istasyonu verisini toplayan │
│  ve ML/DL optimizasyonuna beslenen lokal servis                 │
└─────────────────────────────────────────────────────────────────┘
```

```
User App  ◄──────────────────────► Admin Portal
    │                                    │
    │          PostgreSQL (Ana DB)        │
    └──────────────┬─────────────────────┘
                   │
            Local Data API
            (PostgreSQL local → sync → Ana DB)
                   │
            ML/DL Motoru
            (scikit-learn + PyTorch)
                   │
            Raporlar → Admin Portal
```

---

## Teknoloji Stack (Kararlaştırıldı)

### Part 1 — User App

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Framework | **Next.js 14** (App Router) + TypeScript | PWA desteği, SSR, dosya tabanlı routing |
| UI | **Tailwind CSS** | UX spec'e hızlı uyum, utility-first |
| State | **Zustand** | Hafif, basit global state yönetimi |
| Auth | **JWT** (cookie tabanlı, httpOnly) | Admin Portal'dan beslenir |
| PWA | **next-pwa** | Ana ekrana ekle, offline destek |
| QR Okuma | **html5-qrcode** | Web kameradan QR okuma, cross-platform |
| API İletişimi | **Axios + React Query** | Cache, refetch, optimistic update |

### Part 2 — Admin Portal

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Framework | **Next.js 14** + TypeScript | User App ile tutarlılık |
| UI | **Tailwind CSS + shadcn/ui** | Admin paneli için hazır bileşenler |
| Tablo/Grid | **TanStack Table** | Büyük veri setleri, filtreleme, sıralama |
| Grafikler | **Recharts** | ML/DL çıktılarını görselleştirme |
| Form | **React Hook Form + Zod** | Validasyon |
| Auth | **JWT** + rol tabanlı erişim (RBAC) | Admin / süpervizör rolleri |
| QR Üretimi | **qrcode** npm paketi | Dinamik QR oluşturma |

### Part 3 — Local Data API

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Framework | **Python FastAPI** | Async, hızlı, ML entegrasyonu doğal |
| Ana DB | **PostgreSQL** | Karmaşık ilişkisel veri, ölçeklenebilir, gelecek geliştirmelere açık |
| ORM | **SQLAlchemy + Alembic** | Migration desteği |
| Lokal Fallback | **SQLite** | İnternetsiz ortamda çalışmaya devam eder |
| Senkronizasyon | **Webhook + Retry Queue** | İnternet gelince ana DB'ye aktarır |
| ML | **scikit-learn** | Anomali tespiti, benchmarking, klasik analiz |
| DL | **PyTorch** | Zaman serisi tahmini, trend analizi |
| Servis | **Uvicorn + systemd/NSSM** | Linux/Windows'ta servis olarak çalışır |

### Veritabanı Şeması (Ana Tablolar)

```
personnel        → Personel bilgileri, platform, proje ataması
shifts           → Vardiyalar (A/B/C, saatler, proje bağlantısı)
shift_assignments→ Personel-vardiya atamaları
turnstile_logs   → Turnike giriş/çıkış kayıtları
stations         → İş istasyonları tanımı
work_tasks       → Görev tanımları
work_assignments → Personel-görev atamaları (çoklu aktif desteklenir)
work_logs        → QR okutma ile oluşan başlat/bitir kayıtları
checkin_logs     → Check-in QR okutma kayıtları
qr_tokens        → One-time token havuzu (station_id, token, used, created_at)
```

---

## QR Sistemi (Kararlaştırıldı)

### Genel Kural
Her QR okutulduğunda token geçersiz olur ve yeni token otomatik oluşturulur.
Kamera: Web kamerası üzerinden `html5-qrcode` ile okunur.

### İstasyon QR Ekranı Akışı

```
Admin "Depo A Giriş Kapısı" istasyonunu oluşturur
           │
           ▼
Admin Portal bir display URL üretir:
https://app/station/depo-a-giris   ← Bu link değişmez
           │
           ▼
Bu URL bir ekranda (tablet/monitor) açık kalır
Ekran sürekli bir QR gösterir
           │
           ▼
QR içinde one-time UUID token bulunur
Ekran her okutmadan sonra yeni token üretip yeni QR gösterir
           │
           ▼
Personel telefonuyla QR'ı okur → kamera açılır (html5-qrcode)
           │
           ▼
Token backend'e gönderilir → doğrulanır → check-in / work-log kaydedilir
           │
           ▼
Ekranda yeni QR belirir (önceki token artık geçersiz)
```

### Token Yaşam Döngüsü

```
qr_tokens tablosu:
  id          UUID PK
  station_id  FK → stations
  token       UUID (her okutmada yenisi üretilir)
  used        boolean (okutulunca true)
  created_at  timestamp
  used_at     timestamp
```

### Admin'den Link Oluşturma

1. Admin Portal → "İstasyonlar" menüsü
2. "Yeni İstasyon Ekle": ad, tür (giriş kapısı / iş istasyonu), depo
3. Sistem bir display URL üretir → admin bu URL'i ekranın tarayıcısına girer
4. Ayrıca bir embed kodu verir (başka bir sisteme gömmek için)

### Enocta & Yolport Entegrasyonu

- **Yöntem: iframe embed**
- Admin Portal'dan her uygulamanın URL'i ve iframe parametreleri girilir
- User App içinde bir "Uygulamalar" sayfası bu iframe'leri yükler
- Fallback: iframe yüklenemezse deep link (yeni sekme) olarak açılır

---

## Part 1 — User App Modülleri

### 1. Kimlik Doğrulama
- Kullanıcı adı + şifre girişi
- JWT (httpOnly cookie), mobilde kalıcı oturum
- Admin Portal'dan kullanıcı ve şifre yönetimi
- iframe olarak kullanıldığında token query param ile geçilir

### 2. Profilim
Kullanıcının kimlik ve görev bilgileri (Admin Portal'dan beslenir, sadece okunur).

| Alan | Örnek |
|------|-------|
| Ad / Soyad | Recep Ulu |
| Telefon | 533 315 68 81 |
| Platform | PX |
| Proje | SEPHORA |
| Personel No | — |

### 3. Uygulamalar (Hub)
iframe embed ile entegre dış uygulamalar.

| Uygulama | Tür |
|----------|-----|
| Enocta | iframe (fallback: deep link) |
| Yolport | iframe (fallback: deep link) |

### 4. Dashboard (Ana Ekran)
- Güncel vardiya kartı (proje, saat)
- Duyuru/haber bandı
- Hızlı erişim: İK, Yemek Listesi, Doktor/Revir
- Tarih + saat

### 5. Aylık Devam Durumu
- Renk kodlu takvim (Yeşil: çalışma, Kırmızı: izin, Turuncu: tatil)
- Aylık özet

### 6. Haftalık Çalışma Performansı
- Sol panel: ay listesi, aktif ay yeşil
- Aylık takvim → güne tıkla → o hafta yeşil vurgulanır
- Alt panel: Platform | Proje | Vardiya bilgisi
- Haftalık gün tablosu (Pzt–Paz)
- Turnike Saati ve Aktivite Saati (Local Data API'den gelir)

### 7. Work (İş Görevi)
- Aynı anda birden fazla aktif görev olabilir
- Her kart: görev adı, istasyon, öncelik, beklenen süre, durum
- Göreve başla/bitir: İstasyon QR'ını okutur
- Aktif görevler arasında geçiş yapılabilir
- Geçmiş görevler listelenir

### 8. Check-In
- QR tarama ekranı (html5-qrcode ile kamera açılır)
- Kapı istasyonundaki QR okutulur → check-in kaydedilir
- Alt kısım: Check-in geçmişi takvimi (Vardiya ekranı ile aynı yapı)

---

## Part 2 — Admin Portal Modülleri

| Modül | İşlev |
|-------|-------|
| Kullanıcı Yönetimi | Personel CRUD, platform/proje/rol ataması, şifre yönetimi |
| Vardiya Yönetimi | Vardiya oluştur, personele ata, saat düzenle |
| Turnike Verisi | Manuel giriş veya CSV import, Local API senkronizasyonu |
| İstasyon Yönetimi | İstasyon oluştur, display URL üret, embed kodu üret |
| Work Atama | Personele görev ata (çoklu), istasyon bağla, hedef süre gir |
| QR Yönetimi | Token durumlarını izle (aktif/kullanıldı/expired) |
| Embed Ayarları | iframe URL üret, izin parametreleri, boyut ayarı |
| ML/DL Raporları | Verimlilik skorları, anomali raporları, trend grafikleri |
| Duyurular | Dashboard'da görünen haber/duyuru yönetimi |

### RBAC Roller

| Rol | Yetki |
|-----|-------|
| Süper Admin | Her şey |
| Proje Yöneticisi | Kendi projesindeki personel, vardiya, work, raporlar |
| Süpervizör | Work atama, check-in izleme |

---

## Part 3 — Local Data API

### Amaç
- Turnike giriş/çıkış verisini yakalar
- İş istasyonu QR okutma verisini yakalar
- Offline çalışır, internet gelince Ana DB ile senkronize olur
- ML/DL katmanını besler
- Raporlar yalnızca Admin Portal'da görüntülenir

### Mimari

```
Turnike Sistemi     İstasyon QR Ekranları     User App (Check-In/Work)
       │                     │                          │
       └─────────────────────┴──────────────────────────┘
                             │
                   Local Data API (FastAPI)
                   PC'de servis olarak çalışır
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
        SQLite (offline)          PostgreSQL (local)
               │                           │
               └─────────────┬─────────────┘
                             │ Webhook + Retry Queue
                             ▼
                    Ana PostgreSQL (server)
                             │
                    ML/DL Optimizasyon Motoru
                             │
                    Admin Portal Raporları
```

### ML/DL Katmanı

| Girdi | Model | Çıktı |
|-------|-------|-------|
| Turnike + aktivite süresi | scikit-learn (IsolationForest) | Anomali tespiti |
| Görev süreleri | scikit-learn (RandomForest) | Verimlilik skoru |
| Zaman serisi verisi | PyTorch (LSTM) | Trend tahmini |
| Vardiya karşılaştırması | scikit-learn (KMeans) | Benchmarking |

**Raporlar yalnızca Admin Portal'da görüntülenir, User App'e kapalıdır.**

---

## Agent Yapısı ve Terminal Kullanımı

Bu proje 3 bağımsız Claude Code agent'ı ile geliştirilecek.
Her agent kendi dizininde çalışır, birbirini beklemez.

### Dizin Yapısı

```
shifttrack/
├── user-app/        ← Agent 1 çalışır
├── admin-portal/    ← Agent 2 çalışır
└── local-api/       ← Agent 3 çalışır
```

---

### Agent 1 — User App (Orchestrator + 3 Sub-agent)

**Model: `claude-opus-4-6`** (orchestrator — koordinasyon ve mimari kararlar)

**Sub-agent'lar: `claude-sonnet-4-6`** (hız + kalite dengesi)

**Görev:** User App'i (Next.js PWA) hem UX hem backend açısından geliştir.
Orchestrator, sub-agent'lara görev dağıtır ve entegrasyonu yönetir.

**Sub-agent 1a — Frontend** (`claude-sonnet-4-6`)
- Next.js 14 + TypeScript + Tailwind ile tüm sayfaları yaz
- shifttrack-ux.md'yi referans al, Arvato renk paleti ve NunitoSans font kullan
- PWA manifest ve service worker yapılandır
- html5-qrcode ile kamera/QR entegrasyonu

**Sub-agent 1b — Backend** (`claude-sonnet-4-6`)
- Next.js API routes ile REST endpoint'leri yaz
- PostgreSQL bağlantısı, Prisma ORM şeması
- JWT auth middleware
- Local Data API ile haberleşen endpoint'ler

**Sub-agent 1c — Integration** (`claude-sonnet-4-6`)
- Frontend ile backend'i birbirine bağlar
- React Query ile data fetching katmanı
- Axios interceptor (token yenileme, hata yönetimi)
- iframe embed desteği ve SSO token geçişi

**Terminal komutu:**

```bash
cd shifttrack/user-app

claude --model claude-opus-4-6 \
  --system "Sen ShiftTrack User App'in baş mimarısın. \
  Bu projede 3 sub-agent koordine ediyorsun: \
  1) Frontend (Next.js/Tailwind/QR), \
  2) Backend (API routes/PostgreSQL/Auth), \
  3) Integration (React Query/iframe). \
  Her sub-agent'a net görev ver, çakışmaları önle, \
  entegrasyon noktalarını (API contract, tip tanımları) siz kararlaştırın." \
  --context "$(cat ../mavi-yaka-platform.md ../shifttrack-ux.md)"
```

---

### Agent 2 — Admin Portal (Bağımsız)

**Model: `claude-sonnet-4-6`**

**Görev:** Admin Portal'ı tek başına yaz. User App'ten bağımsızdır, kendi backend'i vardır.
User App ile paylaşılan tek şey: PostgreSQL ana DB ve JWT secret.

**Kapsam:**
- Next.js 14 + shadcn/ui + TanStack Table
- Tüm admin modülleri (Kullanıcı, Vardiya, Work, QR, İstasyon, Raporlar)
- RBAC middleware
- qrcode npm ile QR üretimi + display URL sistemi
- Recharts ile ML/DL rapor grafikleri
- Local Data API ile REST iletişimi

**Terminal komutu:**

```bash
cd shifttrack/admin-portal

claude --model claude-sonnet-4-6 \
  --system "Sen ShiftTrack Admin Portal'ı tek başına geliştiriyorsun. \
  Next.js 14, shadcn/ui, TanStack Table, Recharts kullan. \
  Admin sadece masaüstünde kullanılacak, mobile-first gerekmez. \
  QR üretimi, istasyon yönetimi ve ML/DL raporları önceliklidir." \
  --context "$(cat ../mavi-yaka-platform.md)"
```

---

### Agent 3 — QR Sistemi (Bağımsız)

**Model: `claude-sonnet-4-6`**

**Görev:** QR token sistemini, istasyon display ekranlarını ve web kamera QR okuma altyapısını geliştir.
Hem User App hem Admin Portal'a entegre edilecek modüller üretir.

**Kapsam:**
- `qr_tokens` tablo yapısı ve PostgreSQL migrasyonu
- FastAPI endpoint'leri: token üret, token doğrula, token tüket
- İstasyon display sayfası (Next.js): sürekli yeni QR gösterir, okutulunca otomatik yenilenir
- html5-qrcode entegrasyon modülü (User App'e import edilecek)
- Admin Portal'a eklenecek QR yönetim bileşenleri
- Token güvenliği: UUID v4, one-time, TTL (24 saat expire)

**Terminal komutu:**

```bash
cd shifttrack

claude --model claude-sonnet-4-6 \
  --system "Sen ShiftTrack QR sistemini geliştiriyorsun. \
  Görevin 3 bölüm: \
  1) FastAPI token API (üret/doğrula/tüket), \
  2) Next.js istasyon display sayfası (sürekli yenilenen QR ekranı), \
  3) html5-qrcode tabanlı tarama bileşeni (User App için). \
  Her QR bir kez kullanılabilir, okutulunca yeni token oluşur. \
  Güvenlik: UUID v4 token, httpOnly doğrulama, 24 saat TTL." \
  --context "$(cat mavi-yaka-platform.md)"
```

---

## Agent'ları Başlatma Sırası

```
1. Önce Agent 3 (QR Sistemi) başlar
   → API contract ve token şemasını tanımlar
   → Diğer agent'lar bu şemaya göre entegrasyon yapar

2. Agent 2 (Admin Portal) ve Agent 1 (User App) paralel başlar
   → Her ikisi de QR Agent'ın tanımladığı API'yi kullanır
   → Birbirini beklemez, ayrı terminallerde çalışır

3. Entegrasyon testi en sonda yapılır
   → Agent 1'in Integration sub-agent'ı koordine eder
```

```bash
# Terminal 1
cd shifttrack && claude --model claude-sonnet-4-6 [Agent 3 - QR]

# Terminal 2 (Agent 3 API contract hazır olduktan sonra)
cd shifttrack/user-app && claude --model claude-opus-4-6 [Agent 1 - User App]

# Terminal 3 (Agent 3 API contract hazır olduktan sonra)
cd shifttrack/admin-portal && claude --model claude-sonnet-4-6 [Agent 2 - Admin]
```

---

## Model Seçim Gerekçesi

| Agent | Model | Neden |
|-------|-------|-------|
| Agent 1 Orchestrator | `claude-opus-4-6` | Çoklu sub-agent koordinasyonu, mimari kararlar, çakışma çözümü |
| Agent 1 Sub-agent'lar | `claude-sonnet-4-6` | Kod yazımında hız + kalite dengesi, tekrarlayan görevler |
| Agent 2 Admin Portal | `claude-sonnet-4-6` | Bağımsız, net kapsam, Opus gerekmez |
| Agent 3 QR Sistemi | `claude-sonnet-4-6` | Odaklı teknik görev, net sınırlar |

---

## Gelecek Özellikler

- [ ] Push bildirimleri (vardiya değişikliği, servis hareketi)
- [ ] Offline mod genişletme (tam PWA cache stratejisi)
- [ ] Çoklu depo / lokasyon desteği
- [ ] Mobil uygulama (React Native — mevcut Next.js bileşenleri yeniden kullanılabilir)
