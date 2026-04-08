# Panduan Deployment Online (Docker)

Aplikasi ini berjalan sepenuhnya via Docker Compose — backend API, frontend React, PostgreSQL, Redis, Nginx, dan SSL otomatis (Let's Encrypt).

## Prasyarat

- VPS/server dengan OS Linux (Ubuntu 20.04+ direkomendasikan)
- Docker Engine + Docker Compose v2 terinstall
- Domain yang sudah diarahkan ke IP server (A record)
- Port 80 dan 443 terbuka di firewall

## Langkah Deployment

### 1. Clone repository

```bash
git clone https://github.com/ayebe51/saas-manajemen-pesantren.git
cd saas-manajemen-pesantren
```

### 2. Konfigurasi environment

```bash
cp .env.example .env
nano .env
```

Wajib diisi:
- `DOMAIN` — domain Anda, contoh: `pesantren.pondok.id`
- `EMAIL` — email untuk notifikasi SSL Let's Encrypt
- `DB_PASSWORD` — password database yang kuat
- `REDIS_PASSWORD` — password Redis
- `JWT_SECRET` dan `JWT_REFRESH_SECRET` — generate dengan `openssl rand -base64 64`

### 3. Inisialisasi SSL (sekali saja)

```bash
bash scripts/init-ssl.sh
```

Script ini akan:
- Membuat folder yang dibutuhkan
- Mengkonfigurasi nginx untuk domain Anda
- Meminta sertifikat SSL dari Let's Encrypt
- Sertifikat diperbarui otomatis setiap 12 jam

### 4. Jalankan semua service

```bash
docker compose up -d
```

### 5. Jalankan migrasi database

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run prisma:seed
```

### 6. Akses aplikasi

Buka `https://DOMAIN_ANDA` di browser.

---

## Update Aplikasi

```bash
bash scripts/deploy.sh
```

## Cek Status Service

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f nginx
```

## Struktur Port

| Service   | Internal | Exposed |
|-----------|----------|---------|
| Nginx     | 80, 443  | 80, 443 |
| API       | 3000     | -       |
| Frontend  | 80       | -       |
| PostgreSQL| 5432     | -       |
| Redis     | 6379     | -       |

PostgreSQL dan Redis tidak diekspos ke publik — hanya bisa diakses antar container.
