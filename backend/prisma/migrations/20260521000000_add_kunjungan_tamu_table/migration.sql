-- Migration: add_kunjungan_tamu_table
-- Requirements: 10.1, 10.2

CREATE TABLE "kunjungan_tamu" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "santriId"     TEXT NOT NULL,
    "namaTamu"     TEXT NOT NULL,
    "hubungan"     TEXT NOT NULL,
    "waktuMasuk"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "waktuKeluar"  TIMESTAMPTZ,
    "keterangan"   TEXT,
    "createdBy"    TEXT NOT NULL,
    "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt"    TIMESTAMPTZ NOT NULL,

    CONSTRAINT "kunjungan_tamu_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "kunjungan_tamu_tenantId_idx" ON "kunjungan_tamu"("tenantId");
CREATE INDEX "kunjungan_tamu_santriId_idx" ON "kunjungan_tamu"("santriId");
CREATE INDEX "kunjungan_tamu_waktuMasuk_idx" ON "kunjungan_tamu"("waktuMasuk");

ALTER TABLE "kunjungan_tamu" ADD CONSTRAINT "kunjungan_tamu_santriId_fkey"
    FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kunjungan_tamu" ADD CONSTRAINT "kunjungan_tamu_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
