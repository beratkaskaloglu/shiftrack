# ShiftTrack — Kurulum Scripti (Windows PowerShell)
# Calistir: .\setup.ps1

Write-Host ""
Write-Host "========================================"
Write-Host "  ShiftTrack Kurulum Scripti"
Write-Host "========================================"
Write-Host ""
Write-Host "SQL Server baglanti bilgilerini girin:"
Write-Host ""

$DB_SERVER = Read-Host "  Server adresi (ornek: 192.168.1.10)"
$DB_PORT_INPUT = Read-Host "  Port [1433]"
$DB_PORT = if ($DB_PORT_INPUT -eq "") { "1433" } else { $DB_PORT_INPUT }
$DB_USER = Read-Host "  Kullanici adi"
$DB_PASS = Read-Host "  Sifre" -AsSecureString
$DB_PASS_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASS)
)
$DB_NAME = Read-Host "  Veritabani adi"

Write-Host ""
Write-Host "----------------------------------------"
Write-Host "Baglanti bilgileri:"
Write-Host "  Server    : ${DB_SERVER}:${DB_PORT}"
Write-Host "  Kullanici : $DB_USER"
Write-Host "  Veritabani: $DB_NAME"
Write-Host "----------------------------------------"
Write-Host ""

# ── user-app/.env ──────────────────────────────────────────────────────────────

$userEnv = @"
DATABASE_URL="sqlserver://${DB_SERVER}:${DB_PORT};database=${DB_NAME};user=${DB_USER};password=${DB_PASS_PLAIN};encrypt=true;trustServerCertificate=true"
JWT_ACCESS_SECRET="shifttrack-access-secret-change-in-production"
JWT_REFRESH_SECRET="shifttrack-refresh-secret-change-in-production"
QR_TOKEN_API_URL="http://localhost:8000"
NEXT_PUBLIC_QR_API_URL="http://localhost:8000"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
"@

Set-Content -Path "user-app\.env" -Value $userEnv
Write-Host "[OK] user-app\.env olusturuldu"

# ── qr-system/api/.env ─────────────────────────────────────────────────────────

$encodedPass = [Uri]::EscapeDataString($DB_PASS_PLAIN)

# Yüklü ODBC driver versiyonunu otomatik bul (17 veya 18)
$odbcDriver = python3 -c @"
import pyodbc
drivers = pyodbc.drivers()
for d in ['ODBC Driver 18 for SQL Server', 'ODBC Driver 17 for SQL Server']:
    if d in drivers:
        print(d)
        break
"@ 2>$null
if (-not $odbcDriver) { $odbcDriver = "ODBC Driver 17 for SQL Server" }
$odbcDriverEncoded = $odbcDriver -replace ' ', '+'
Write-Host "[INFO] Kullanilan ODBC Driver: $odbcDriver"

$apiEnv = @"
DATABASE_URL=mssql+aioodbc://${DB_USER}:${encodedPass}@${DB_SERVER}:${DB_PORT}/${DB_NAME}?driver=${odbcDriverEncoded}&TrustServerCertificate=yes
JWT_SECRET=shifttrack-dev-secret-2026
ENVIRONMENT=development
TOKEN_TTL_HOURS=24
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
"@

Set-Content -Path "qr-system\api\.env" -Value $apiEnv
Write-Host "[OK] qr-system\api\.env olusturuldu"

# ── Bagimliliklar ───────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "User App bagimliliklar yukleniyor..."
Set-Location user-app
npm install --silent
Write-Host "[OK] npm install tamamlandi"

Write-Host ""
Write-Host "Veritabani tablolari olusturuluyor..."
npx prisma db push
Write-Host "[OK] prisma db push tamamlandi"

Write-Host ""
Write-Host "Demo verisi ekleniyor..."
npx prisma db seed
Write-Host "[OK] Seed tamamlandi"

Set-Location ..

Write-Host ""
Write-Host "QR Token API bagimliliklar yukleniyor..."
Set-Location qr-system\api
pip install -r requirements.txt -q
Write-Host "[OK] pip install tamamlandi"
Set-Location ..\..

Write-Host ""
Write-Host "Station Display bagimliliklar yukleniyor..."
Set-Location qr-system\station-display
npm install --silent
Write-Host "[OK] npm install tamamlandi"
Set-Location ..\..

Write-Host ""
Write-Host "========================================"
Write-Host "  Kurulum tamamlandi!"
Write-Host ""
Write-Host "  Servisleri baslatmak icin:"
Write-Host "  .\opening.ps1"
Write-Host ""
Write-Host "  Giris bilgileri:"
Write-Host "  User App  : recep.ulu / recep123"
Write-Host "  Admin     : admin / admin123"
Write-Host "========================================"
Write-Host ""
