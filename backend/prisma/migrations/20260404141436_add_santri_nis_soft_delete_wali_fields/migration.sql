-- Migration: add_santri_nis_soft_delete_wali_fields
-- Adds NIS (unique), soft delete (deletedAt), and extended fields to santri and wali tables
-- Requirements: 3.1, 3.2, 3.3

-- Add new columns to santri table
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "nis" VARCHAR(20);
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "namaLengkap" TEXT;
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "namaPanggilan" VARCHAR(100);
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "jenisKelamin" VARCHAR(10);
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "tanggalLahir" TIMESTAMPTZ;
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "tempatLahir" VARCHAR(100);
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "kelasId" UUID;
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "noHp" VARCHAR(20);
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "alamat" TEXT;
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "fotoUrl" VARCHAR(500);
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "tanggalMasuk" TIMESTAMPTZ;
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "tanggalKeluar" TIMESTAMPTZ;
ALTER TABLE "santri" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;

-- Add UNIQUE constraint on nis (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS "santri_nis_key" ON "santri"("nis") WHERE "nis" IS NOT NULL;

-- Add indexes for soft delete and nis lookups
CREATE INDEX IF NOT EXISTS "santri_nis_idx" ON "santri"("nis");
CREATE INDEX IF NOT EXISTS "santri_deletedAt_idx" ON "santri"("deletedAt");

-- Add new columns to wali table
ALTER TABLE "wali" ADD COLUMN IF NOT EXISTS "userId" UUID;
ALTER TABLE "wali" ADD COLUMN IF NOT EXISTS "namaLengkap" TEXT;
ALTER TABLE "wali" ADD COLUMN IF NOT EXISTS "hubungan" VARCHAR(50);
ALTER TABLE "wali" ADD COLUMN IF NOT EXISTS "noHp" VARCHAR(20);
ALTER TABLE "wali" ADD COLUMN IF NOT EXISTS "alamat" TEXT;
