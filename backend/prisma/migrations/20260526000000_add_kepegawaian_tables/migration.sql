-- CreateTable: pegawai
-- Requirements: 16.1, 16.3

CREATE TABLE "pegawai" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "nama" TEXT NOT NULL,
    "jabatan" TEXT NOT NULL,
    "tanggalBergabung" TIMESTAMP(3) NOT NULL,
    "statusAktif" BOOLEAN NOT NULL DEFAULT true,
    "nip" TEXT,
    "noHp" TEXT,
    "alamat" TEXT,
    "dokumenUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateTable: presensi_pegawai
-- Requirements: 16.3

CREATE TABLE "presensi_pegawai" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pegawaiId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "jamMasuk" TIMESTAMP(3),
    "jamKeluar" TIMESTAMP(3),
    "keterangan" TEXT,
    "dicatatOleh" TEXT,
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presensi_pegawai_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pegawai_userId_key" ON "pegawai"("userId");

CREATE INDEX "pegawai_tenantId_idx" ON "pegawai"("tenantId");
CREATE INDEX "pegawai_statusAktif_idx" ON "pegawai"("statusAktif");
CREATE INDEX "pegawai_deletedAt_idx" ON "pegawai"("deletedAt");

CREATE UNIQUE INDEX "presensi_pegawai_pegawaiId_tanggal_key" ON "presensi_pegawai"("pegawaiId", "tanggal");
CREATE INDEX "presensi_pegawai_tenantId_idx" ON "presensi_pegawai"("tenantId");
CREATE INDEX "presensi_pegawai_pegawaiId_idx" ON "presensi_pegawai"("pegawaiId");
CREATE INDEX "presensi_pegawai_tanggal_idx" ON "presensi_pegawai"("tanggal");

-- AddForeignKey
ALTER TABLE "pegawai" ADD CONSTRAINT "pegawai_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pegawai" ADD CONSTRAINT "pegawai_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "presensi_pegawai" ADD CONSTRAINT "presensi_pegawai_pegawaiId_fkey" FOREIGN KEY ("pegawaiId") REFERENCES "pegawai"("id") ON DELETE CASCADE ON UPDATE CASCADE;
