-- CreateEnum
CREATE TYPE "PpdbStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "ppdb_pendaftaran" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nomorPendaftaran" TEXT NOT NULL,
    "dataCalon" JSONB NOT NULL,
    "status" "PpdbStatus" NOT NULL DEFAULT 'DRAFT',
    "catatan" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "santriId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppdb_pendaftaran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ppdb_pendaftaran_nomorPendaftaran_key" ON "ppdb_pendaftaran"("nomorPendaftaran");

-- CreateIndex
CREATE UNIQUE INDEX "ppdb_pendaftaran_santriId_key" ON "ppdb_pendaftaran"("santriId");

-- CreateIndex
CREATE INDEX "ppdb_pendaftaran_tenantId_idx" ON "ppdb_pendaftaran"("tenantId");

-- CreateIndex
CREATE INDEX "ppdb_pendaftaran_status_idx" ON "ppdb_pendaftaran"("status");

-- AddForeignKey
ALTER TABLE "ppdb_pendaftaran" ADD CONSTRAINT "ppdb_pendaftaran_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ppdb_pendaftaran" ADD CONSTRAINT "ppdb_pendaftaran_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE SET NULL ON UPDATE CASCADE;
