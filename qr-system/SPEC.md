# ShiftTrack QR System — Specification

**Agent 3 deliverable.** This document describes the API contract, data model, token lifecycle, and integration points for the QR system. Agent 1 (User App) and Agent 2 (Admin Portal) use this as their reference.

---

## Directory Structure

```
qr-system/
├── api/                        ← FastAPI token & station API
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── routers/
│   │   ├── tokens.py
│   │   └── stations.py
│   ├── migrations/
│   │   └── 001_create_qr_tokens.sql
│   ├── requirements.txt
│   └── .env.example
├── station-display/            ← Next.js kiosk page (runs on station screen)
│   ├── components/
│   │   └── StationDisplay.tsx
│   ├── hooks/
│   │   └── useStationToken.ts
│   ├── lib/
│   │   └── api.ts
│   └── pages/
│       └── station/[stationId].tsx
├── scanner/                    ← QR scanning module (imported by User App)
│   ├── components/
│   │   └── QRScanner.tsx
│   ├── hooks/
│   │   └── useQRScanner.ts
│   ├── lib/
│   │   ├── parseQRValue.ts
│   │   └── validateToken.ts
│   └── index.ts
└── admin-components/           ← QR management components (imported by Admin Portal)
    ├── components/
    │   ├── QRTokenTable.tsx
    │   └── StationQRPanel.tsx
    ├── lib/
    │   └── adminApi.ts
    └── index.ts
```

---

## QR Value Format

Every QR code encodes a string in this exact format:

```
shifttrack://qr/{station_id}/{token}
```

| Part | Type | Example |
|------|------|---------|
| `station_id` | UUID v4 | `a1b2c3d4-...` |
| `token` | UUID v4 | `f9e8d7c6-...` |

The `parseQRValue()` utility in `scanner/lib/parseQRValue.ts` validates and parses this format. Any QR code that does not match this structure is rejected.

---

## Data Model

### `stations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `name` | VARCHAR(255) | Human-readable name |
| `type` | VARCHAR(50) | `entry` or `work_station` |
| `warehouse` | VARCHAR(255) | Optional |
| `display_url` | VARCHAR(512) UNIQUE | Auto-generated slug on create, never changes |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### `qr_tokens`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `station_id` | UUID FK → stations | Cascade delete |
| `token` | UUID UNIQUE | The value embedded in the QR code |
| `used` | BOOLEAN | Set to `true` on first scan |
| `created_at` | TIMESTAMPTZ | |
| `used_at` | TIMESTAMPTZ | Null until consumed |
| `expires_at` | TIMESTAMPTZ | `created_at + 24h` |

**Indexes:**
- `idx_qr_tokens_station_active` — partial index on `(station_id) WHERE used = FALSE AND expires_at > NOW()`
- `idx_qr_tokens_token` — partial index on `(token) WHERE used = FALSE`
- `idx_qr_tokens_expires_at` — for TTL cleanup queries

---

## Token Lifecycle

```
Admin creates station
        │
        ▼
display_url is generated (never changes)
        │
        ▼
Station screen opens display_url
        │
        ▼
GET /tokens/station/{id}/current
→ No active token? One is created automatically.
→ Active token returned with qr_value embedded.
        │
        ▼
QR code is displayed on screen
Station screen polls every 2s for token changes.
        │
        ▼
Personnel scans QR with phone
        │
        ▼
POST /tokens/validate
  { token, station_id, personnel_id }
        │
     ┌──┴──────────────────────┐
  invalid                    valid
  (used / expired /         token.used = true
   wrong station)           token.used_at = now()
     │                      new QRToken created
     ▼                             │
  Error response                   ▼
                          ValidateResponse {
                            valid: true,
                            next_token: <new UUID>,
                            station_name, station_type
                          }
        │
        ▼
Station screen detects token change via polling
→ New QR is rendered automatically
```

**Token status rules:**

| Condition | Status |
|-----------|--------|
| `used = false` AND `expires_at > now` | `active` |
| `used = true` | `used` |
| `used = false` AND `expires_at <= now` | `expired` |

---

## API Reference

Base URL: `http://localhost:8000` (configurable via `NEXT_PUBLIC_QR_API_URL`)

### Stations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stations` | List all stations |
| POST | `/stations` | Create station, auto-generate `display_url` |
| GET | `/stations/{id}` | Get station by ID |
| GET | `/stations/by-url/{slug}` | Get station by display URL slug |

**POST /stations — request body:**
```json
{
  "name": "Depo A Giriş Kapısı",
  "type": "entry",
  "warehouse": "Depo A"
}
```

**POST /stations — response:**
```json
{
  "id": "uuid",
  "name": "Depo A Giriş Kapısı",
  "type": "entry",
  "warehouse": "Depo A",
  "display_url": "station/depo-a-giris-kapisi-a1b2c3d4",
  "created_at": "2026-03-21T10:00:00Z"
}
```

---

### Tokens

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tokens/station/{id}/current` | Get active token (creates one if none exists) |
| POST | `/tokens/station/{id}/generate` | Force-generate a new token (invalidates current) |
| POST | `/tokens/validate` | Validate + consume token, issue next token |
| GET | `/tokens/admin/list` | List tokens with status (admin only) |
| POST | `/tokens/admin/cleanup` | Mark all expired unused tokens as used |

**GET /tokens/station/{id}/current — response:**
```json
{
  "token": "uuid",
  "station_id": "uuid",
  "expires_at": "2026-03-22T10:00:00Z",
  "qr_value": "shifttrack://qr/{station_id}/{token}"
}
```

**POST /tokens/validate — request body:**
```json
{
  "token": "uuid",
  "station_id": "uuid",
  "personnel_id": "uuid"
}
```

**POST /tokens/validate — success response:**
```json
{
  "valid": true,
  "station_id": "uuid",
  "station_name": "Depo A Giriş Kapısı",
  "station_type": "entry",
  "used_at": "2026-03-21T10:05:00Z",
  "next_token": "uuid",
  "message": "Check-in başarılı"
}
```

**POST /tokens/validate — failure response:**
```json
{
  "valid": false,
  "message": "Token already used"
}
```

Possible failure messages: `"Token not found"`, `"Token already used"`, `"Token expired"`, `"Token does not belong to this station"`

---

## Security Rules

| Rule | Detail |
|------|--------|
| One-time use | `used` flag set atomically on first validation; second scan returns `valid: false` |
| UUID v4 | Tokens are cryptographically random 128-bit UUIDs — not guessable |
| 24-hour TTL | `expires_at = created_at + 24h`; expired tokens are rejected regardless of `used` |
| Station binding | Token is validated against the expected `station_id`; cross-station use is rejected |
| Auto-rotation | New token is issued inside the same DB transaction as the consume operation |

---

## Integration Guide

### Agent 1 — User App

**Import the scanner module:**

```tsx
import { QRScanner } from "@/qr/scanner";

// Check-In page
<QRScanner
  personnelId={user.id}
  mode="check_in"
  onSuccess={(result) => handleCheckIn(result)}
  onClose={() => setScannerOpen(false)}
/>

// Work page (with station lock)
<QRScanner
  personnelId={user.id}
  mode="work"
  expectedStationId={task.station_id}
  onSuccess={(result) => handleWorkLog(result)}
  onClose={() => setScannerOpen(false)}
/>
```

**Add the proxy API route** (`/api/qr/validate`) — forwards the validation request to the QR Token API and attaches `personnel_id` from the JWT session:

```ts
// pages/api/qr/validate.ts (or app/api/qr/validate/route.ts)
// 1. Verify JWT, extract personnel_id
// 2. POST to QR_API_URL/tokens/validate with { token, station_id, personnel_id }
// 3. Return the response
```

**Required env vars:**
```
NEXT_PUBLIC_API_URL=https://app.shifttrack.com   # User App base URL (for the proxy route)
```

---

### Agent 2 — Admin Portal

**Import the admin components:**

```tsx
import { QRTokenTable, StationQRPanel } from "@/qr/admin-components";

// QR Management page
<QRTokenTable />

// Station Management page
<StationQRPanel baseDisplayUrl="https://display.shifttrack.com" />
```

**Required env vars:**
```
NEXT_PUBLIC_QR_API_URL=http://localhost:8000   # QR Token API base URL
```

The `StationQRPanel` generates the display URL that should be entered into the station's browser. The URL format is:

```
https://display.shifttrack.com/station/{name-slug}-{id-prefix}
```

This URL is **permanent** — it never changes even when tokens rotate.

---

## Station Display Screen

The `station-display` Next.js app runs on the tablet or monitor at each station. It:

1. Opens `https://display.shifttrack.com/station/{stationId}`
2. Fetches the current active token on load
3. Polls every **2 seconds** — detects when a token has been consumed and re-renders the new QR automatically
4. Regenerates the token preemptively when less than **30 seconds** remain before expiry
5. Shows a brief "scanned" animation when the token changes

The station screen requires no authentication. It only reads tokens, never validates them.

---

## Environment Variables

### QR Token API (`api/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | yes | — | `postgresql+asyncpg://...` |
| `JWT_SECRET` | yes | — | Shared with User App and Admin Portal |
| `ENVIRONMENT` | no | `development` | Enables SQL echo in dev |
| `TOKEN_TTL_HOURS` | no | `24` | Token expiry duration |
| `CORS_ORIGINS` | no | `http://localhost:3000,...` | Comma-separated allowed origins |

### Station Display (`station-display/.env.local`)

| Variable | Required | Default |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | yes | `http://localhost:8000` |

---

## Running Locally

```bash
# 1. Start the QR Token API
cd qr-system/api
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL
uvicorn main:app --reload --port 8000

# 2. Start the station display app
cd qr-system/station-display
npm install
npm run dev   # runs on port 3002

# 3. Open a station screen (replace with a real station UUID after creating one)
open http://localhost:3002/station/{station_id}
```

API docs available at `http://localhost:8000/docs` (Swagger UI).
