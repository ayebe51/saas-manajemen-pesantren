-- CreateTable: asrama
CREATE TABLE "asrama" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asrama_pkey" PRIMARY KEY ("id")
);

-- CreateTable: kamar
CREATE TABLE "kamar" (
    "id" TEXT NOT NULL,
    "asramaId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "lantai" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'TERSEDIA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kamar_pkey" PRIMARY KEY ("id")
);

-- CreateTable: penempatan_santri
CREATE TABLE "penempatan_santri" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "kamarId" TEXT NOT NULL,
    "tanggalMasuk" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggalKeluar" TIMESTAMP(3),
    "isAktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penempatan_santri_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asrama_tenantId_idx" ON "asrama"("tenantId");

-- CreateIndex
CREATE INDEX "kamar_asramaId_idx" ON "kamar"("asramaId");

-- CreateIndex
CREATE INDEX "penempatan_santri_santriId_idx" ON "penempatan_santri"("santriId");

-- CreateIndex
CREATE INDEX "penempatan_santri_kamarId_idx" ON "penempatan_santri"("kamarId");

-- CreateIndex
CREATE INDEX "penempatan_santri_isAktif_idx" ON "penempatan_santri"("isAktif");

-- AddForeignKey
ALTER TABLE "asrama" ADD CONSTRAINT "asrama_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kamar" ADD CONSTRAINT "kamar_asramaId_fkey" FOREIGN KEY ("asramaId") REFERENCES "asrama"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penempatan_santri" ADD CONSTRAINT "penempatan_santri_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penempatan_santri" ADD CONSTRAINT "penempatan_santri_kamarId_fkey" FOREIGN KEY ("kamarId") REFERENCES "kamar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
