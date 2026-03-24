#!/bin/bash
# ShiftTrack — Kurulum Scripti (macOS / Linux)
# Çalıştır: bash setup.sh

set -e

echo ""
echo "========================================"
echo "  ShiftTrack Kurulum Scripti"
echo "========================================"
echo ""
echo "SQL Server bağlantı bilgilerini girin:"
echo ""

read -p "  Server adresi (örn: 192.168.1.10): " DB_SERVER
read -p "  Port [1433]: " DB_PORT
DB_PORT=${DB_PORT:-1433}
read -p "  Kullanıcı adı: " DB_USER
read -s -p "  Şifre: " DB_PASS
echo ""
read -p "  Veritabanı adı: " DB_NAME

echo ""
echo "----------------------------------------"
echo "Bağlantı bilgileri:"
echo "  Server : $DB_SERVER:$DB_PORT"
echo "  Kullanıcı: $DB_USER"
echo "  Veritabanı: $DB_NAME"
echo "----------------------------------------"
echo ""

# ── user-app/.env ──────────────────────────────────────────────────────────────

JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

cat > user-app/.env <<EOF
DATABASE_URL="sqlserver://${DB_SERVER}:${DB_PORT};database=${DB_NAME};user=${DB_USER};password=${DB_PASS};encrypt=true;trustServerCertificate=true"
JWT_ACCESS_SECRET="${JWT_ACCESS_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
QR_TOKEN_API_URL="http://localhost:8000"
NEXT_PUBLIC_QR_API_URL="http://localhost:8000"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
EOF

echo "[OK] user-app/.env olusturuldu"

# ── qr-system/api/.env ─────────────────────────────────────────────────────────

ENCODED_PASS=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${DB_PASS}', safe=''))")

# Yüklü ODBC driver versiyonunu otomatik bul (17 veya 18)
ODBC_DRIVER=$(python3 -c "
import pyodbc
drivers = pyodbc.drivers()
for d in ['ODBC Driver 18 for SQL Server', 'ODBC Driver 17 for SQL Server']:
    if d in drivers:
        print(d)
        break
" 2>/dev/null || echo "ODBC Driver 17 for SQL Server")
ODBC_DRIVER_ENCODED=$(echo "$ODBC_DRIVER" | sed 's/ /+/g')
echo "[INFO] Kullanilan ODBC Driver: $ODBC_DRIVER"

QR_JWT_SECRET=$(openssl rand -hex 32)

cat > qr-system/api/.env <<EOF
DATABASE_URL=mssql+aioodbc://${DB_USER}:${ENCODED_PASS}@${DB_SERVER}:${DB_PORT}/${DB_NAME}?driver=${ODBC_DRIVER_ENCODED}&TrustServerCertificate=yes
JWT_SECRET=${QR_JWT_SECRET}
ENVIRONMENT=development
TOKEN_TTL_HOURS=24
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003
EOF

echo "[OK] qr-system/api/.env olusturuldu"

# ── Bagimliliklar ───────────────────────────────────────────────────────────────

echo ""
echo "User App bagimliliklar yukleniyor..."
cd user-app
npm install --silent
echo "[OK] npm install tamamlandi"

echo ""
echo "Veritabani tablolari olusturuluyor..."
npx prisma db push
echo "[OK] prisma db push tamamlandi"

echo ""
echo "Demo verisi ekleniyor..."
npx prisma db seed
echo "[OK] Seed tamamlandi"

cd ..

echo ""
echo "QR Token API bagimliliklar yukleniyor..."
cd qr-system/api
pip install -r requirements.txt -q
echo "[OK] pip install tamamlandi"
cd ../..

echo ""
echo "Station Display bagimliliklar yukleniyor..."
cd qr-system/station-display
npm install --silent
echo "[OK] npm install tamamlandi"
cd ../..

echo ""
echo "========================================"
echo "  Kurulum tamamlandi!"
echo ""
echo "  Servisleri baslatmak icin:"
echo "  bash opening.sh"
echo ""
echo "  Giris bilgileri icin veritabani seed verisine bakin."
echo "========================================"
echo ""
