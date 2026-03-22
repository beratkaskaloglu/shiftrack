# ShiftTrack — ML/DL Altyapı Sunumu

**Shift & Workforce Tracking System — Veri Odaklı Optimizasyon Katmanı**

> Bu doküman, ShiftTrack'in makine öğrenmesi ve derin öğrenme altyapısının teknik mimarisini, veri akışlarını, model seçimlerini ve ürettiği metrikleri detaylıca açıklar.

---

## 1. Genel Mimari

```
┌─────────────────────────────────────────────────────────────────────┐
│  VERİ KAYNAKLARI                                                    │
│  Turnike sistemi │ QR Check-In │ İş İstasyonu QR │ Vardiya sistemi  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ ham log verisi
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LOCAL DATA API (FastAPI — PC'de servis olarak çalışır)             │
│  PostgreSQL local → Webhook → Ana PostgreSQL (server)               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ temizlenmiş + zenginleştirilmiş veri
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ML/DL MOTORU                                                       │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────────┐  │
│  │IsolationForest│ │RandomForest  │ │  LSTM    │ │   KMeans      │  │
│  │Anomali Tespiti│ │Verimlilik    │ │ Trend    │ │Benchmarking   │  │
│  └─────────────┘ └──────────────┘ └──────────┘ └───────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ skorlar, tahminler, raporlar
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ADMIN PORTAL — ML/DL Raporlar (Recharts grafikleri)                │
│  Verimlilik Panosu │ Anomali Uyarıları │ Trend Tahmini │ Karşılaştırma│
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Veri Kaynakları ve Ham Metrikler

### 2.1 Turnike Verisi (`turnstile_logs`)

```
personnelId   → Personel kimliği
entryTime     → İşe giriş zamanı (turnike geçişi)
exitTime      → İşten çıkış zamanı
stationName   → Hangi kapıdan geçildi
```

**Türetilen metrikler:**
- `actual_work_duration` = exitTime − entryTime
- `expected_work_duration` = vardiya bitiş − vardiya başlangıç
- `overtime_minutes` = actual − expected (pozitif: fazla mesai, negatif: erken çıkış)
- `punctuality_score` = entryTime'ın vardiya başlangıcına olan sapması (dakika cinsinden)

### 2.2 QR Check-In Verisi (`checkin_logs`)

```
personnelId   → Personel kimliği
stationId     → Hangi kapı istasyonu
stationType   → entry | work_station
checkedInAt   → Okutma zamanı
```

**Türetilen metrikler:**
- `checkin_delay_minutes` = checkinTime − vardiya başlangıcı
- `checkin_consistency` = son 30 günde ortalama gecikme ± std sapma
- `missing_checkin_rate` = check-in yapılmayan gün oranı

### 2.3 İş Görevi Verisi (`work_logs` + `work_assignments`)

```
action        → start | stop
scannedAt     → QR okutma zamanı
workTaskId    → Hangi görev
stationId     → Hangi istasyon
```

**Türetilen metrikler:**
- `task_duration` = stop − start (dakika)
- `efficiency_ratio` = expectedDuration / actual_duration
  - 1.0 = tam zamanında
  - > 1.0 = beklenenden hızlı
  - < 1.0 = beklenenden yavaş
- `task_completion_rate` = tamamlanan / atanan görev oranı
- `multi_task_overlap` = aynı anda kaç görev aktif

### 2.4 Vardiya Verisi (`shift_assignments` + `shifts`)

```
startTime  → Vardiya başlangıcı (HH:mm)
endTime    → Vardiya bitişi (HH:mm)
type       → A | B | C
```

**Türetilen metrikler:**
- `shift_attendance_rate` = vardiya günleri içinde çalışılan gün oranı
- `shift_type_performance` = A/B/C vardiyası bazında verimlilik karşılaştırması

---

## 3. ML Modelleri

### 3.1 Anomali Tespiti — IsolationForest (scikit-learn)

**Amaç:** Normalden sapan davranışları tespit etmek.

**Girdi özellikleri:**
```python
features = [
    "actual_work_duration",      # Gerçek çalışma süresi
    "checkin_delay_minutes",      # Check-in gecikmesi
    "task_efficiency_ratio",      # Görev verimlilik oranı
    "overtime_minutes",           # Fazla/eksik mesai
    "missing_checkin_rate_7d",    # Son 7 günde eksik check-in
]
```

**Model konfigürasyonu:**
```python
from sklearn.ensemble import IsolationForest

model = IsolationForest(
    n_estimators=100,
    contamination=0.05,   # Beklenen anomali oranı %5
    random_state=42,
    n_jobs=-1
)
```

**Çıktı:**
```
anomaly_score    → -1 (anomali) veya 1 (normal)
anomaly_strength → 0.0–1.0 arası skor (ne kadar anomali)
```

**Örnek anomali senaryoları:**
- Turnike girişi var ama QR check-in yok
- 10 saatlik vardiyada 4 saat çalışma
- Normalde A vardiyasında olan personel B vardiyasında görünüyor
- Görev süresi beklenenin 3 katı

**Admin Portal'da görünüm:**
- Kırmızı uyarı kartları
- "Bugün 3 personelde anomali tespit edildi"
- Anomali detay modalı: hangi metrik neden sapıyor

---

### 3.2 Verimlilik Skoru — RandomForest Regresyon (scikit-learn)

**Amaç:** Her personel için 0–100 arası verimlilik skoru üretmek.

**Girdi özellikleri:**
```python
features = [
    "task_efficiency_ratio_avg",   # Ortalama görev verimlilik oranı
    "task_completion_rate",         # Görev tamamlama oranı
    "punctuality_score_avg",        # Ortalama dakiklik skoru
    "attendance_rate_30d",          # Son 30 gün devam oranı
    "overtime_consistency",         # Fazla mesai tutarlılığı
    "shift_type",                   # A/B/C (encoded)
    "days_in_role",                 # Rolde geçirilen gün sayısı
]
```

**Model konfigürasyonu:**
```python
from sklearn.ensemble import RandomForestRegressor

model = RandomForestRegressor(
    n_estimators=200,
    max_depth=10,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1
)
```

**Çıktı:** `efficiency_score` → 0–100

**Skor yorumu:**

| Skor | Kategori | Renk |
|------|----------|------|
| 85–100 | Yüksek Performans | Yeşil |
| 65–84 | Ortalama | Mavi |
| 45–64 | Gelişim Gerekli | Turuncu |
| 0–44 | Kritik | Kırmızı |

**Feature importance çıktısı:**
RandomForest hangi faktörün skoru en çok etkilediğini söyler:
```
task_completion_rate     → %34 etki
punctuality_score_avg    → %28 etki
attendance_rate_30d      → %21 etki
task_efficiency_ratio    → %17 etki
```

**Admin Portal'da görünüm:**
- Her personel için skor kartı
- Takım/proje bazında ortalama skor
- "Bu haftanın en verimli 5 personeli"
- Skor trendi (son 4 hafta)

---

### 3.3 Trend Tahmini — LSTM (PyTorch)

**Amaç:** Gelecek 7–14 günün devam ve verimlilik trendini tahmin etmek.

**Veri yapısı:**
```
Zaman serisi: Günlük bazda, personel/takım/proje seviyesinde
Lookback window: Son 30 gün
Forecast horizon: Sonraki 7 gün
```

**Girdi dizisi (her gün için):**
```python
sequence_features = [
    "daily_attendance_rate",      # O günün devam oranı
    "daily_avg_efficiency",       # O günün ortalama verimliliği
    "daily_checkin_delay_avg",    # O günün ortalama gecikmesi
    "is_monday",                  # Pazartesi etkisi (boolean)
    "week_of_month",              # Ay içindeki hafta
    "workload_index",             # O günkü toplam aktif görev sayısı
]
```

**Model mimarisi:**
```python
import torch
import torch.nn as nn

class ShiftTrackLSTM(nn.Module):
    def __init__(self):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=6,       # 6 özellik
            hidden_size=64,
            num_layers=2,
            dropout=0.2,
            batch_first=True
        )
        self.fc = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(32, 7)    # 7 günlük tahmin
        )

    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        return self.fc(lstm_out[:, -1, :])
```

**Eğitim:**
- Optimizer: Adam (lr=0.001)
- Loss: MSE
- Batch size: 32
- Epochs: 50 (early stopping ile)
- Yeniden eğitim: Her hafta pazar gecesi otomatik

**Çıktı:** 7 günlük günlük verimlilik tahmin dizisi `[0.0–1.0]`

**Admin Portal'da görünüm:**
- "Gelecek Hafta Tahmini" grafiği (çizgi + güven bandı)
- "Salı günü devam oranında %15 düşüş bekleniyor" gibi uyarılar
- Tahmin vs gerçekleşen karşılaştırma grafiği

---

### 3.4 Benchmarking — KMeans Kümeleme (scikit-learn)

**Amaç:** Benzer performans profiline sahip personelleri gruplamak ve grup içi/dışı karşılaştırma yapmak.

**Girdi özellikleri:**
```python
features = [
    "efficiency_score",            # RandomForest çıktısı
    "attendance_rate_90d",         # Son 90 gün devam
    "avg_task_duration_ratio",     # Ortalama görev süre oranı
    "punctuality_score_avg",       # Dakiklik skoru
    "task_variety",                # Farklı görev türü sayısı
]
```

**Model konfigürasyonu:**
```python
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

model = KMeans(
    n_clusters=4,    # 4 performans grubu
    init="k-means++",
    n_init=10,
    random_state=42
)
```

**Küme profilleri (otomatik etiketlenir):**

| Küme | Profil | Tipik Özellikler |
|------|--------|-----------------|
| A | Yüksek Performans | Yüksek verimlilik, düşük gecikme, yüksek devam |
| B | Tutarlı Orta | Ortalama tüm metrikler, düşük varyans |
| C | Potansiyelli | Yüksek verimlilik ama devam sorunu |
| D | Gelişim Gerekli | Düşük verimlilik, yüksek gecikme |

**Kullanım senaryoları:**
- "Küme A'daki personellerin ortak özellikleri neler?" → Yönetici için best practice
- "Küme C'deki personel neden A'ya geçemiyor?" → Gelişim planı
- Proje bazında küme dağılımı → Hangi projede daha çok D kümesi var?

**Admin Portal'da görünüm:**
- 2D scatter plot (PCA ile boyut indirgeme)
- Küme bazında metrik karşılaştırma tablosu
- "Sephora projesinde %40 personel B kümesinde"

---

## 4. Pipeline Akışı

```
Her gece 02:00'de otomatik çalışır (cron job):

1. ETL (30 dk)
   ├── Ham veriler PostgreSQL'den çekilir
   ├── Eksik değerler doldurulur (forward fill / medyan)
   ├── Outlier'lar clip edilir (IQR yöntemi)
   └── Feature engineering (türetilen metrikler hesaplanır)

2. Model Çalıştırma (15 dk)
   ├── IsolationForest → anomali skorları
   ├── RandomForest → verimlilik skorları
   ├── KMeans → küme atamaları
   └── LSTM → 7 günlük tahmin dizisi

3. Sonuç Yazma (5 dk)
   ├── ml_results tablosuna yazılır
   ├── Yüksek anomali skoru → alert tablosuna kayıt
   └── Admin Portal için cache güncellenir

Toplam pipeline süresi: ~50 dk
```

---

## 5. Veri Tabanı Tabloları (ML Katmanı)

```sql
-- Model çıktıları
CREATE TABLE ml_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id    UUID NOT NULL,
    date            DATE NOT NULL,
    efficiency_score    FLOAT,      -- 0-100, RandomForest
    anomaly_score       FLOAT,      -- -1/1, IsolationForest
    anomaly_strength    FLOAT,      -- 0-1
    cluster_id          INT,        -- 0-3, KMeans
    forecast_7d         JSONB,      -- [0.82, 0.79, ...], LSTM
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Anomali uyarıları
CREATE TABLE ml_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id    UUID NOT NULL,
    alert_type      TEXT,           -- 'anomaly' | 'low_efficiency' | 'attendance'
    severity        TEXT,           -- 'low' | 'medium' | 'high'
    description     TEXT,
    triggered_at    TIMESTAMP DEFAULT NOW(),
    resolved        BOOLEAN DEFAULT FALSE
);

-- Model metadata
CREATE TABLE ml_model_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name      TEXT,           -- 'isolation_forest' | 'random_forest' etc.
    run_at          TIMESTAMP,
    records_processed INT,
    metrics         JSONB           -- {'mae': 0.12, 'r2': 0.87, ...}
);
```

---

## 6. Admin Portal'da ML/DL Görünümü

### 6.1 Verimlilik Panosu

```
┌──────────────────────────────────────────────────────────────┐
│  SEPHORA Projesi — Verimlilik Özeti                         │
│                                                              │
│  Ortalama Skor: 72.4    ▲ +3.2 (geçen haftaya göre)        │
│                                                              │
│  ████████░░  Yüksek Performans  18 kişi (%36)              │
│  ██████░░░░  Ortalama           22 kişi (%44)              │
│  ███░░░░░░░  Gelişim Gerekli    8 kişi  (%16)              │
│  █░░░░░░░░░  Kritik             2 kişi  (%4)               │
│                                                              │
│  [Detaylı Tablo]  [CSV İndir]  [Geçen Haftayla Karşılaştır]│
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Anomali Uyarıları

```
┌──────────────────────────────────────────────────────────────┐
│  Bugünkü Anomaliler  (3)                                    │
│                                                              │
│  🔴 YÜKSEK  Ahmet K.   — Turnike girişi var, check-in yok  │
│  🟡 ORTA    Mehmet Y.  — Görev süresi beklenenden %240 uzun │
│  🟡 ORTA    Fatma S.   — Son 5 günde 3 gecikme             │
│                                                              │
│  [Tümünü Gör]  [Kapat]                                      │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Trend Tahmini Grafiği (Recharts)

```
Verimlilik Trendi — Son 2 Hafta + Gelecek 1 Hafta

  100%│
   85%│ ───────────────────────────── ╌╌╌╌╌╌╌
   70%│                           (gerçek)    (tahmin)
   55%│
   40%│
      └────────────────────────────────────────
       Pzt  Sal  Çar  Per  Cum  Cmt  Paz  (bu hafta)
                                    ↑
                               "bugün"
```

### 6.4 KMeans Benchmarking

```
┌──────────────────────────────────────────────────────────────┐
│  Performans Kümeleri — SEPHORA Projesi                      │
│                                                              │
│  Küme A (Yüksek)    ●●●●●●●●  8 kişi   ort. skor: 91.2   │
│  Küme B (Ortalama)  ●●●●●●●●●●●●●●  14 kişi  ort: 72.8   │
│  Küme C (Potansiyel)●●●●  4 kişi   ort. skor: 68.4        │
│  Küme D (Gelişim)   ●●  2 kişi    ort. skor: 41.7         │
│                                                              │
│  [Küme Detayı]  [Personel Listesi]  [Scatter Plot]          │
└──────────────────────────────────────────────────────────────┘
```

---

## 7. Güvenlik ve Gizlilik

- ML sonuçları **yalnızca Admin Portal**'da görünür, User App'e kapalıdır
- Verimlilik skorları personele gösterilmez
- Anomali uyarıları HR + Proje Yöneticisi rolüne sınırlıdır
- Model eğitiminde kişisel veriler anonimleştirilebilir (personel ID hash)
- KVKK uyumluluk: Raw log verisi 2 yıl saklanır, ML sonuçları 1 yıl

---

## 8. Uygulama Takvimi

| Aşama | Kapsam | Durum |
|-------|--------|-------|
| 1 | Veri toplama altyapısı (turnike + QR logları) | Tamamlandı |
| 2 | Feature engineering + ETL pipeline | Planlandı |
| 3 | IsolationForest + RandomForest modelleri | Planlandı |
| 4 | Admin Portal ML dashboard | Planlandı |
| 5 | LSTM trend tahmini | Planlandı |
| 6 | KMeans benchmarking + scatter plot | Planlandı |
| 7 | Otomatik yeniden eğitim (cron) | Planlandı |
| 8 | Alert sistemi (yüksek anomali bildirimi) | Planlandı |

---

## 9. Neden Bu Modeller?

| İhtiyaç | Neden Bu Model? |
|---------|----------------|
| Anomali tespiti | IsolationForest etiketli veri gerektirmez — elimizde "normal vs anormal" labelli veri yok |
| Verimlilik skoru | RandomForest yorumlanabilir (feature importance), overfit'e dayanıklı, küçük-orta veri setinde iyi çalışır |
| Trend tahmini | LSTM zaman serisi bağımlılıklarını yakalar — ardışık günler arası korelasyon kritik |
| Benchmarking | KMeans süpervize öğrenme gerektirmez — personelleri otomatik gruplar, yönetici müdahalesi gerekmez |

---

## 10. Gelecek Geliştirmeler

- **Prophet (Meta):** Tatil/bayram etkisini modelleyen zaman serisi — LSTM'e alternatif veya tamamlayıcı
- **Transformer (Attention):** LSTM'den daha uzun bağımlılıklar için — veri büyüdükçe devreye alınabilir
- **Real-time anomali:** Batch yerine streaming pipeline (Apache Kafka) — büyük ölçekte
- **Öneri sistemi:** "Bu personele şu görevi atayın" — collaborative filtering
- **NLP:** Süpervizör notlarından otomatik içgörü çıkarma
