-- Migration: update_kelas_add_rombel_kapasitas
-- Adds rombel, kapasitas, isTertinggi to kelas table
-- Changes tingkat from String? to Int

-- Add new columns
ALTER TABLE "kelas"
  ADD COLUMN IF NOT EXISTS "rombel"      TEXT,
  ADD COLUMN IF NOT EXISTS "kapasitas"   INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "isTertinggi" BOOLEAN NOT NULL DEFAULT false;

-- Migrate tingkat: convert existing string values to int, add as new int column
-- First add the new int column
ALTER TABLE "kelas" ADD COLUMN IF NOT EXISTS "tingkat_int" INTEGER;

-- Backfill: try to cast existing tingkat string to int
UPDATE "kelas" SET "tingkat_int" = CAST("tingkat" AS INTEGER) WHERE "tingkat" ~ '^\d+$';
UPDATE "kelas" SET "tingkat_int" = 1 WHERE "tingkat_int" IS NULL;

-- Drop old string column and rename new int column
ALTER TABLE "kelas" DROP COLUMN IF EXISTS "tingkat";
ALTER TABLE "kelas" RENAME COLUMN "tingkat_int" TO "tingkat";
ALTER TABLE "kelas" ALTER COLUMN "tingkat" SET NOT NULL;
ALTER TABLE "kelas" ALTER COLUMN "tingkat" SET DEFAULT 1;

-- Add index
CREATE INDEX IF NOT EXISTS "kelas_tenantId_tingkat_idx" ON "kelas"("tenantId", "tingkat");
