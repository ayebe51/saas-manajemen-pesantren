-- Migration: add_santri_extended_fields
-- Adds NIK, namaAyah, namaIbu, provinsi, kabupaten, kecamatan, kelurahan to santri table

ALTER TABLE "santri"
  ADD COLUMN IF NOT EXISTS "nik"       TEXT,
  ADD COLUMN IF NOT EXISTS "namaAyah"  TEXT,
  ADD COLUMN IF NOT EXISTS "namaIbu"   TEXT,
  ADD COLUMN IF NOT EXISTS "provinsi"  TEXT,
  ADD COLUMN IF NOT EXISTS "kabupaten" TEXT,
  ADD COLUMN IF NOT EXISTS "kecamatan" TEXT,
  ADD COLUMN IF NOT EXISTS "kelurahan" TEXT;
