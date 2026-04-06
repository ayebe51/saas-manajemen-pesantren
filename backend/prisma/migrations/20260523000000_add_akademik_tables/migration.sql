-- Migration: add_akademik_tables
-- Requirements: 6.1, 6.2, 6.4

-- Tabel Kelas
CREATE TABLE "kelas" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "nama"        TEXT NOT NULL,
    "tingkat"     TEXT,
    "waliKelasId" TEXT,
    "tahunAjaran" TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMPTZ NOT NULL,

    CONSTRAINT "kelas_pkey" PRIMARY KEY ("id")
);

-- Tabel Mata Pelajaran
CREATE TABLE "mata_pelajaran" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "nama"        TEXT NOT NULL,
    "kode"        TEXT,
    "deskripsi"   TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMPTZ NOT NULL,

    CONSTRAINT "mata_pelajaran_pkey" PRIMARY KEY ("id")
);

-- Tabel Jadwal Pelajaran
CREATE TABLE "jadwal_pelajaran" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "kelasId"     TEXT NOT NULL,
    "mapelId"     TEXT NOT NULL,
    "pengajarId"  TEXT NOT NULL,
    "hariKe"      INTEGER NOT NULL,
    "jamMulai"    TEXT NOT NULL,
    "jamSelesai"  TEXT NOT NULL,
    "ruangan"     TEXT,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMPTZ NOT NULL,

    CONSTRAINT "jadwal_pelajaran_pkey" PRIMARY KEY ("id")
);

-- Tabel Nilai Santri
CREATE TABLE "nilai_santri" (
    "id"          TEXT NOT NULL,
    "tenantId"    TEXT NOT NULL,
    "santriId"    TEXT NOT NULL,
    "mapelId"     TEXT NOT NULL,
    "kelasId"     TEXT,
    "periode"     TEXT NOT NULL,
    "tipeNilai"   TEXT NOT NULL,
    "nilai"       DECIMAL(5,2) NOT NULL,
    "keterangan"  TEXT,
    "createdBy"   TEXT NOT NULL,
    "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMPTZ NOT NULL,

    CONSTRAINT "nilai_santri_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "nilai_santri_nilai_check" CHECK ("nilai" >= 0 AND "nilai" <= 100)
);

-- Indexes
CREATE INDEX "kelas_tenantId_idx" ON "kelas"("tenantId");
CREATE INDEX "mata_pelajaran_tenantId_idx" ON "mata_pelajaran"("tenantId");
CREATE INDEX "jadwal_pelajaran_tenantId_idx" ON "jadwal_pelajaran"("tenantId");
CREATE INDEX "jadwal_pelajaran_kelasId_idx" ON "jadwal_pelajaran"("kelasId");
CREATE INDEX "jadwal_pelajaran_mapelId_idx" ON "jadwal_pelajaran"("mapelId");
CREATE INDEX "jadwal_pelajaran_pengajarId_idx" ON "jadwal_pelajaran"("pengajarId");
CREATE INDEX "nilai_santri_tenantId_idx" ON "nilai_santri"("tenantId");
CREATE INDEX "nilai_santri_santriId_idx" ON "nilai_santri"("santriId");
CREATE INDEX "nilai_santri_mapelId_idx" ON "nilai_santri"("mapelId");
CREATE INDEX "nilai_santri_periode_idx" ON "nilai_santri"("periode");

-- Foreign Keys
ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_kelasId_fkey"
    FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "jadwal_pelajaran" ADD CONSTRAINT "jadwal_pelajaran_mapelId_fkey"
    FOREIGN KEY ("mapelId") REFERENCES "mata_pelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nilai_santri" ADD CONSTRAINT "nilai_santri_santriId_fkey"
    FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nilai_santri" ADD CONSTRAINT "nilai_santri_mapelId_fkey"
    FOREIGN KEY ("mapelId") REFERENCES "mata_pelajaran"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nilai_santri" ADD CONSTRAINT "nilai_santri_kelasId_fkey"
    FOREIGN KEY ("kelasId") REFERENCES "kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
