# ShiftTrack — UX & Tasarım Spesifikasyonu

**Shift & Workforce Tracking System**

> Bu doküman, ShiftTrack uygulamasının görsel tasarım dilini, bileşen yapısını ve kullanıcı deneyimi prensiplerini tanımlar. Arvato kurumsal kimlik rehberi esas alınmıştır.

---

## Tema

### Çift Tema Desteği

Uygulama hem Light hem Dark tema ile çalışır. Kullanıcı Settings ekranından toggle ile geçiş yapar.

| Özellik | Light Tema | Dark Tema |
|---------|-----------|-----------|
| Arka plan | `#FFFFFF` Beyaz | `#333333` Dark Grey |
| Logo | Siyah (Pantone Black) | Beyaz |
| Metin | `#333333` | `#FFFFFF` |
| Kart arka planı | `#F5F5F5` Light Grey | `#444444` |
| Birincil aksan | `#007FE2` Arvato Blue | `#007FE2` Arvato Blue |

> Varsayılan tema: **Light**. Depo ortamı koşullarına göre Dark tercih edilebilir.

---

## Renk Paleti

Arvato Communication Guidelines renk sistemini esas alır.

| İsim | Hex | RGB | Kullanım |
|------|-----|-----|---------|
| **Arvato Blue** | `#007FE2` | 0 118 178 | Birincil buton, aksan, ikon, header |
| **Black** | `#000000` | 0 0 0 | Light temada logo |
| **Dark Grey** | `#333333` | 51 51 51 | Dark tema arka plan, ana metin |
| **Middle Grey** | `#808080` | 128 128 128 | İkincil metin, placeholder |
| **Light Grey** | `#CCCCCC` | 204 204 204 | Ayraç, border, kart arka planı |
| **White** | `#FFFFFF` | 255 255 255 | Light tema arka plan, dark temada logo |
| **Ruby Red** | `#D11A4C` | 209 26 76 | Hata durumu, modal header (Report Error) |
| **Ice Blue** | `#0BBBE4` | 11 187 228 | Bilgi badge, ikincil aksan |
| **Yeşil** | `#22C55E` | — | Çalışma günü, aktif durum, seçili hafta |
| **Turuncu** | `#F97316` | — | Resmi tatil |

---

## Tipografi

**Font Ailesi:** `NunitoSans`

| Stil | Kullanım |
|------|---------|
| NunitoSans Bold | Ekran başlıkları, kişi adı, önemli metrikler |
| NunitoSans SemiBold | Menü öğeleri, kart başlıkları, etiketler |
| NunitoSans Regular | Gövde metin, form alanları, açıklamalar |
| NunitoSans Light | İkincil bilgiler, alt başlıklar |

---

## Global Layout

### Mobil (Primary)

```
┌─────────────────────────┐
│  TOP BAR                │  ← Mavi (#007FE2), App adı + aksiyonlar
├─────────────────────────┤
│                         │
│  İÇERİK ALANI           │  ← Scroll edilebilir, kart tabanlı
│                         │
│                         │
├─────────────────────────┤
│  BOTTOM NAV (opsiyonel) │
└─────────────────────────┘
```

### Sandwich Menü Açıkken

```
┌──────────┬──────────────┐
│  MENÜ    │              │
│  (Beyaz  │  İÇERİK      │
│   bg)    │  (Karartılmış│
│          │   overlay)   │
│          │              │
└──────────┴──────────────┘
```

---

## Bileşenler

### 1. Top Bar

- Arka plan: `#007FE2` Arvato Blue
- Sol: Geri butonu `<` (sadece alt sayfalarda) veya hamburger menu ikonu
- Orta: Uygulama adı + platform/proje bilgisi (küçük alt metin)
- Sağ: Bildirim ikonu `(i)` veya çıkış `→`

```
[ ≡ ]  ShiftTrack          [ (i) ] [ → ]
       Arvato|SuperApp
```

---

### 2. Login Ekranı

- Tam ekran, merkez hizalı
- **Light varyant:** Beyaz arka plan, siyah Arvato logosu
- **Dark varyant:** `#333333` arka plan, beyaz logo
- Alternatif: Depo fotoğrafı arka plan (overlay ile okunabilirlik sağlanır)
- Bileşenler:
  - Logo (üst merkez)
  - Username input (alt çizgi stil, placeholder: "Username")
  - Password input (alt çizgi stil, placeholder: "Password")
  - "Forgot Password" link sağ hizalı, mavi
  - "Login" butonu — tam genişlik, `#007FE2`, beyaz metin, rounded
  - Versiyon numarası alt merkez (örn. `v1.0.0`)

---

### 3. Sidebar Menü

- Arka plan: Beyaz (Light) / `#333333` (Dark)
- Genişlik: Ekranın ~%65'i
- Açılış: Soldan kayarak (slide-in)
- Kapanış: Dışına tıklama veya geri butonu, overlay karartması

#### Menü Öğeleri (ikon + metin)

| İkon | Başlık |
|------|--------|
| Ev | Ana Sayfa |
| Kişi | Profilim |
| Uygulama grid | Uygulamalar |
| Takvim | Vardiya |
| Barkod | Check-In |
| Görev listesi | Work |
| Çıkış | Çıkış Yap |

- Her öğe: 56px yükseklik, sol ikon (24px, `#007FE2`), metin NunitoSans SemiBold
- Aktif öğe: Sol border `#007FE2`, hafif mavi arka plan tonu
- Bölümler arası ince ayraç `#CCCCCC`

---

### 4. Kart Bileşeni

Tüm dashboard içerikleri kart tabanlıdır.

- Arka plan: Beyaz / `#444444` (Dark)
- Border radius: 12px
- Gölge: `0 2px 8px rgba(0,0,0,0.08)`
- Padding: 16px
- Başlık: NunitoSans SemiBold, `#333333` / `#FFFFFF`

---

### 5. Dashboard (Ana Ekran)

**Üst bölüm:**
- Kaydırmalı duyuru/haber bandı (ticker) — mavi arka plan, beyaz metin

**Sol/Ana alan (kart grid):**
- Vardiya bilgisi kartı (büyük, vurgulu)
- Haber/duyuru kartları (fotoğraf + başlık + özet)

**Sağ panel (mobilde alt kart olarak):**
- Tarih & Saat
- Hava durumu
- Doğum günleri
- Yemek listesi
- Anket

**Alt hızlı erişim:**
- Icon grid (2x2 veya kaydırmalı yatay)
- IK Portal, Enocta, Yolport ikonları
- Her ikon: 56px, beyaz kart içinde, mavi ikon + metin altında

---

### 6. Profil Ekranı

- Üst: Avatar (daire, 80px)
- İsim: NunitoSans Bold, büyük harf
- Bilgi satırları: Sol ikon (`#007FE2`) + etiket (mavi, küçük) + değer (altında)
  - Username
  - Email
  - Telefon
  - Platform
  - Proje
  - Personel No
- Durum badge'leri: `Active` (yeşil), görev tipi (mavi/gri)

---

### 7. Takvim & Performans Ekranı

- Sol panel: Ay listesi (dikey), aktif ay `#22C55E` yeşil
- Ana alan: Aylık takvim grid
  - Çalışma günü: Yeşil
  - Ücretsiz izin: Kırmızı
  - Resmi tatil: Turuncu
- Seçili hafta: Tüm satır yeşil highlight
- Alt panel (seçili hafta detayı):
  - Platform | Proje | Vardiya bilgisi
  - Gün satırı tablosu: Pzt–Paz
  - Turnike Saati ve Aktivite Saati metrik kartları

---

### 8. Work Ekranı

- Görev kartları liste halinde
- Her kart:
  - Görev adı (bold)
  - İstasyon adı
  - Durum badge: `Bekliyor` (gri) / `Devam Ediyor` (mavi) / `Tamamlandı` (yeşil)
  - Beklenen süre vs. geçen süre progress bar
- Aktif görevler üstte, tamamlananlar altta
- Göreve başla/bitir: QR butonuna tap → kamera açılır

---

### 9. Check-In Ekranı

- Merkez: Büyük QR tarama alanı (kamera çerçevesi)
- Alt: "Kamerayı Aç" CTA butonu — tam genişlik, `#007FE2`
- Alt kısım: Check-in geçmişi takvimi (Vardiya ekranıyla aynı yapı)

---

### 10. Modal / Dialog

- Başlık bar: Renk duruma göre değişir
  - Bilgi: `#007FE2` mavi
  - Hata: `#D11A4C` kırmızı
- Kapatma: Sağ üst `×`
- İçerik: Form alanları veya liste
- Alt: Tam genişlik CTA butonu

---

### 11. Form Elemanları

- Input: Alt çizgi stil, placeholder Middle Grey
- Aktif input: Alt çizgi `#007FE2`
- Toggle: Kapalı gri, açık sarı/mavi (settings sayfasında görüldüğü gibi)
- Buton: Tam genişlik, 48px yükseklik, border-radius 8px, `#007FE2`, beyaz metin

---

## Fotoğraf & Görsel Dili

- Gerçek depo/lojistik ortamı fotoğrafları kullanılır
- Arvato Communication & Branding Hub görsel kütüphanesi referans alınır
- Siyah üniforma giyen çalışanlar, depo rafları, endüstriyel zemin
- Haber/duyuru kartlarında bu görseller kullanılır
- Login arka plan alternatifi olarak depo fotoğrafı kullanılabilir (koyu overlay ile)

---

## Settings Ekranı

| Ayar | Tip |
|------|-----|
| Light/Dark Mode | Toggle |
| Tooltips göster | Toggle |
| Font Ailesi | Dropdown (varsayılan: NunitoSans) |

---

## Erişilebilirlik

- Minimum dokunma hedefi: 48x48px
- Yüksek kontrast mod: Depo ışık koşulları için önerilir
- Metin boyutları sistem ayarlarına uyumlu (responsive font)
- Renk körü dostu: Durum bilgisi renk + ikon ile birlikte gösterilir (sadece renke bağımlı değil)
