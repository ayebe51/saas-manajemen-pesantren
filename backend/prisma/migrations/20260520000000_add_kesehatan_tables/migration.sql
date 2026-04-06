-- CreateTable: rekam_medis
-- Requirements: 9.1, 9.2

CREATE TABLE "rekam_medis" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "riwayatPenyakit" TEXT,
    "alergi" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "rekam_medis_pkey" PRIMARY KEY ("id")
);

-- CreateTable: kunjungan_klinik
-- Requirements: 9.1, 9.2

CREATE TABLE "kunjungan_klinik" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "keluhan" TEXT NOT NULL,
    "diagnosis" TEXT,
    "tindakan" TEXT,
    "serverTimestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kunjungan_klinik_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rekam_medis_santriId_key" ON "rekam_medis"("santriId");

-- CreateIndex
CREATE INDEX "rekam_medis_santriId_idx" ON "rekam_medis"("santriId");

-- CreateIndex
CREATE INDEX "kunjungan_klinik_santriId_idx" ON "kunjungan_klinik"("santriId");

-- CreateIndex
CREATE INDEX "kunjungan_klinik_createdBy_idx" ON "kunjungan_klinik"("createdBy");

-- AddForeignKey
ALTER TABLE "rekam_medis" ADD CONSTRAINT "rekam_medis_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kunjungan_klinik" ADD CONSTRAINT "kunjungan_klinik_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kunjungan_klinik" ADD CONSTRAINT "kunjungan_klinik_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON UPDATE CASCADE;
