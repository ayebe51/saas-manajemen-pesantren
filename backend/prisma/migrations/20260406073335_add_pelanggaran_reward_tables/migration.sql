-- Migration: add_pelanggaran_reward_tables
-- NOTE: ALTER TABLE statements for wa_queue, wa_templates, invoices, wallet_transactions,
-- santri (new columns), and wali (new columns) have been removed because those columns
-- are added in later migrations (20260501000000, 20260502000000) which run after this one.
-- Only safe operations that reference tables/columns already existing from init migration are kept.

-- CreateEnum
CREATE TYPE "TingkatKeparahan" AS ENUM ('RINGAN', 'SEDANG', 'BERAT');

-- AlterTable: audit_logs — columns added here (all new, safe)
ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "entitasTipe" TEXT,
  ADD COLUMN IF NOT EXISTS "modul" TEXT,
  ADD COLUMN IF NOT EXISTS "nilaiSebelum" JSONB,
  ADD COLUMN IF NOT EXISTS "nilaiSesudah" JSONB,
  ADD COLUMN IF NOT EXISTS "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: pelanggaran — add new columns (safe, pelanggaran exists in init)
ALTER TABLE "pelanggaran"
  ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
  ADD COLUMN IF NOT EXISTS "kategoriId" TEXT,
  ADD COLUMN IF NOT EXISTS "keterangan" TEXT,
  ADD COLUMN IF NOT EXISTS "poin" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "tingkatKeparahan" "TingkatKeparahan";

-- AlterTable: refresh_tokens — add new columns (safe)
ALTER TABLE "refresh_tokens"
  ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tokenHash" TEXT;

-- AlterTable: users — add roleId (safe)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "roleId" TEXT;

-- CreateTable: roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: permissions
CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: login_attempts
CREATE TABLE IF NOT EXISTS "login_attempts" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: license
CREATE TABLE IF NOT EXISTS "license" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "hardwareFingerprint" TEXT,
    "activatedAt" TIMESTAMP(3),
    "lastVerifiedAt" TIMESTAMP(3),
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_pkey" PRIMARY KEY ("id")
);

-- CreateTable: presensi_sessions
CREATE TABLE IF NOT EXISTS "presensi_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "namaSesi" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "qrToken" TEXT,
    "qrExpiresAt" TIMESTAMP(3),
    "lokasiLat" DECIMAL(10,8),
    "lokasiLng" DECIMAL(11,8),
    "radiusMeter" INTEGER NOT NULL DEFAULT 100,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "presensi_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: presensi_records
CREATE TABLE IF NOT EXISTS "presensi_records" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "gpsLat" DECIMAL(10,8),
    "gpsLng" DECIMAL(11,8),
    "gpsAccuracy" DECIMAL(8,2),
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientTimestamp" TIMESTAMP(3),
    "faceVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "presensi_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable: perizinan
CREATE TABLE IF NOT EXISTS "perizinan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "tanggalMulai" TIMESTAMP(3) NOT NULL,
    "tanggalSelesai" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "kembaliAt" TIMESTAMP(3),
    "terlambat" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "perizinan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: kategori_pelanggaran
CREATE TABLE IF NOT EXISTS "kategori_pelanggaran" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tingkatKeparahan" "TingkatKeparahan" NOT NULL,
    "poinDefault" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kategori_pelanggaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable: reward_poin
CREATE TABLE IF NOT EXISTS "reward_poin" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "poin" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_poin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_roleId_module_key" ON "permissions"("roleId", "module");
CREATE INDEX IF NOT EXISTS "login_attempts_ipAddress_attemptedAt_idx" ON "login_attempts"("ipAddress", "attemptedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "license_licenseKey_key" ON "license"("licenseKey");
CREATE UNIQUE INDEX IF NOT EXISTS "presensi_sessions_qrToken_key" ON "presensi_sessions"("qrToken");
CREATE INDEX IF NOT EXISTS "presensi_sessions_tenantId_idx" ON "presensi_sessions"("tenantId");
CREATE INDEX IF NOT EXISTS "presensi_sessions_qrToken_idx" ON "presensi_sessions"("qrToken");
CREATE INDEX IF NOT EXISTS "presensi_records_santriId_idx" ON "presensi_records"("santriId");
CREATE INDEX IF NOT EXISTS "presensi_records_sessionId_idx" ON "presensi_records"("sessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "presensi_records_sessionId_santriId_key" ON "presensi_records"("sessionId", "santriId");
CREATE INDEX IF NOT EXISTS "perizinan_tenantId_idx" ON "perizinan"("tenantId");
CREATE INDEX IF NOT EXISTS "perizinan_santriId_idx" ON "perizinan"("santriId");
CREATE INDEX IF NOT EXISTS "perizinan_status_idx" ON "perizinan"("status");
CREATE INDEX IF NOT EXISTS "perizinan_tanggalSelesai_idx" ON "perizinan"("tanggalSelesai");
CREATE UNIQUE INDEX IF NOT EXISTS "kategori_pelanggaran_nama_key" ON "kategori_pelanggaran"("nama");
CREATE INDEX IF NOT EXISTS "reward_poin_santriId_idx" ON "reward_poin"("santriId");
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "santri_nis_key" ON "santri"("nis");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pelanggaran" ADD CONSTRAINT "pelanggaran_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "kategori_pelanggaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pelanggaran" ADD CONSTRAINT "pelanggaran_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "permissions" ADD CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "presensi_sessions" ADD CONSTRAINT "presensi_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "presensi_records" ADD CONSTRAINT "presensi_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "presensi_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "presensi_records" ADD CONSTRAINT "presensi_records_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perizinan" ADD CONSTRAINT "perizinan_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perizinan" ADD CONSTRAINT "perizinan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "perizinan" ADD CONSTRAINT "perizinan_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "perizinan" ADD CONSTRAINT "perizinan_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reward_poin" ADD CONSTRAINT "reward_poin_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reward_poin" ADD CONSTRAINT "reward_poin_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
