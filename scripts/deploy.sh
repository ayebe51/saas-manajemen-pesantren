#!/bin/bash
# ============================================================
# Script deploy / update aplikasi
# Usage: bash scripts/deploy.sh
# ============================================================

set -e

echo "==> Pull latest code..."
git pull origin main

echo "==> Build & restart services..."
docker compose build --no-cache api worker frontend
docker compose up -d

echo "==> Jalankan migrasi database..."
docker compose exec api npx prisma migrate deploy

echo ""
echo "✓ Deploy selesai. Aplikasi berjalan di https://$(grep DOMAIN .env | cut -d= -f2)"
