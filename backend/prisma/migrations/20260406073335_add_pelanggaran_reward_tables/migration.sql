/*
  Warnings:

  - The primary key for the `wa_queue` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `wa_templates` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[tokenHash]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nis]` on the table `santri` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TingkatKeparahan" AS ENUM ('RINGAN', 'SEDANG', 'BERAT');

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "entitasTipe" TEXT,
ADD COLUMN     "modul" TEXT,
ADD COLUMN     "nilaiSebelum" JSONB,
ADD COLUMN     "nilaiSesudah" JSONB,
ADD COLUMN     "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "amountDue" SET DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "invoiceNumber" SET DATA TYPE TEXT,
ALTER COLUMN "tipe" SET DATA TYPE TEXT,
ALTER COLUMN "jumlah" DROP DEFAULT,
ALTER COLUMN "paidAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pelanggaran" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "kategoriId" TEXT,
ADD COLUMN     "keterangan" TEXT,
ADD COLUMN     "poin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tingkatKeparahan" "TingkatKeparahan";

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "tokenHash" TEXT;

-- AlterTable
ALTER TABLE "santri" ALTER COLUMN "nis" SET DATA TYPE TEXT,
ALTER COLUMN "namaPanggilan" SET DATA TYPE TEXT,
ALTER COLUMN "jenisKelamin" SET DATA TYPE TEXT,
ALTER COLUMN "tanggalLahir" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "tempatLahir" SET DATA TYPE TEXT,
ALTER COLUMN "kelasId" SET DATA TYPE TEXT,
ALTER COLUMN "noHp" SET DATA TYPE TEXT,
ALTER COLUMN "fotoUrl" SET DATA TYPE TEXT,
ALTER COLUMN "tanggalMasuk" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "tanggalKeluar" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "roleId" TEXT;

-- AlterTable
ALTER TABLE "wa_queue" DROP CONSTRAINT "wa_queue_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "nextRetryAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "sentAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "wa_queue_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "wa_templates" DROP CONSTRAINT "wa_templates_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "wa_templates_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "wali" ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "hubungan" SET DATA TYPE TEXT,
ALTER COLUMN "noHp" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "wallet_transactions" ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "type" SET DEFAULT 'TOPUP',
ALTER COLUMN "method" SET DEFAULT 'MANUAL',
ALTER COLUMN "tipe" SET DATA TYPE TEXT,
ALTER COLUMN "jumlah" DROP DEFAULT,
ALTER COLUMN "saldoSebelum" DROP DEFAULT,
ALTER COLUMN "saldoSesudah" DROP DEFAULT,
ALTER COLUMN "serverTimestamp" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT false,
    "canWrite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license" (
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

-- CreateTable
CREATE TABLE "presensi_sessions" (
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

-- CreateTable
CREATE TABLE "presensi_records" (
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

-- CreateTable
CREATE TABLE "perizinan" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perizinan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori_pelanggaran" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tingkatKeparahan" "TingkatKeparahan" NOT NULL,
    "poinDefault" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kategori_pelanggaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_poin" (
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

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_roleId_module_key" ON "permissions"("roleId", "module");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "login_attempts_ipAddress_attemptedAt_idx" ON "login_attempts"("ipAddress", "attemptedAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "license_licenseKey_key" ON "license"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "presensi_sessions_qrToken_key" ON "presensi_sessions"("qrToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "presensi_sessions_tenantId_idx" ON "presensi_sessions"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "presensi_sessions_qrToken_idx" ON "presensi_sessions"("qrToken");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "presensi_records_santriId_idx" ON "presensi_records"("santriId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "presensi_records_sessionId_idx" ON "presensi_records"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "presensi_records_sessionId_santriId_key" ON "presensi_records"("sessionId", "santriId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "perizinan_tenantId_idx" ON "perizinan"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "perizinan_santriId_idx" ON "perizinan"("santriId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "perizinan_status_idx" ON "perizinan"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "perizinan_tanggalSelesai_idx" ON "perizinan"("tanggalSelesai");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "kategori_pelanggaran_nama_key" ON "kategori_pelanggaran"("nama");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reward_poin_santriId_idx" ON "reward_poin"("santriId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "santri_nis_key" ON "santri"("nis");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wa_queue_status_nextRetryAt_idx" ON "wa_queue"("status", "nextRetryAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelanggaran" ADD CONSTRAINT "pelanggaran_kategoriId_fkey" FOREIGN KEY ("kategoriId") REFERENCES "kategori_pelanggaran"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelanggaran" ADD CONSTRAINT "pelanggaran_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_sessions" ADD CONSTRAINT "presensi_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_records" ADD CONSTRAINT "presensi_records_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "presensi_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi_records" ADD CONSTRAINT "presensi_records_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perizinan" ADD CONSTRAINT "perizinan_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perizinan" ADD CONSTRAINT "perizinan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perizinan" ADD CONSTRAINT "perizinan_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "perizinan" ADD CONSTRAINT "perizinan_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_poin" ADD CONSTRAINT "reward_poin_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_poin" ADD CONSTRAINT "reward_poin_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
