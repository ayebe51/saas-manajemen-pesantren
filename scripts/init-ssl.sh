#!/bin/bash
# ============================================================
# Script inisialisasi SSL Let's Encrypt (jalankan sekali)
# Usage: bash scripts/init-ssl.sh
# ============================================================

set -e

# Load .env
if [ ! -f .env ]; then
  echo "ERROR: File .env tidak ditemukan. Copy dari .env.example terlebih dahulu."
  echo "  cp .env.example .env"
  exit 1
fi

source .env

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "ERROR: DOMAIN dan EMAIL harus diisi di .env"
  echo "  DOMAIN=pesantren.example.com"
  echo "  EMAIL=admin@example.com"
  exit 1
fi

echo "==> Domain: $DOMAIN"
echo "==> Email:  $EMAIL"

# Buat folder yang dibutuhkan
mkdir -p certbot/conf certbot/www backend/uploads backend/backup

# Replace DOMAIN_PLACEHOLDER di nginx.conf
echo "==> Konfigurasi nginx untuk domain $DOMAIN..."
sed -i.bak "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" nginx/nginx.conf

# Download recommended TLS params dari Let's Encrypt
if [ ! -f certbot/conf/options-ssl-nginx.conf ]; then
  echo "==> Download TLS options..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o certbot/conf/options-ssl-nginx.conf
fi

if [ ! -f certbot/conf/ssl-dhparams.pem ]; then
  echo "==> Download DH params..."
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    -o certbot/conf/ssl-dhparams.pem
fi

# Buat self-signed cert sementara agar nginx bisa start
echo "==> Membuat sertifikat sementara..."
CERT_PATH="certbot/conf/live/$DOMAIN"
mkdir -p "$CERT_PATH"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$CERT_PATH/privkey.pem" \
  -out "$CERT_PATH/fullchain.pem" \
  -subj "/CN=$DOMAIN" 2>/dev/null

# Start nginx saja dulu
echo "==> Menjalankan nginx..."
docker compose up -d nginx

# Hapus cert sementara
rm -rf certbot/conf/live

# Request cert asli dari Let's Encrypt
echo "==> Meminta sertifikat Let's Encrypt..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

# Restart nginx dengan cert asli
echo "==> Restart nginx..."
docker compose restart nginx

echo ""
echo "✓ SSL berhasil dikonfigurasi untuk $DOMAIN"
echo "✓ Sertifikat akan diperbarui otomatis setiap 12 jam"
echo ""
echo "Jalankan semua service:"
echo "  docker compose up -d"
