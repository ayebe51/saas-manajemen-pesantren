-- CreateTable
CREATE TABLE "buku_penghubung" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "waliKelasId" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buku_penghubung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balasan_buku_penghubung" (
    "id" TEXT NOT NULL,
    "bukuPenghubungId" TEXT NOT NULL,
    "penulisId" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "serverTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balasan_buku_penghubung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "buku_penghubung_santriId_idx" ON "buku_penghubung"("santriId");

-- CreateIndex
CREATE INDEX "buku_penghubung_waliKelasId_idx" ON "buku_penghubung"("waliKelasId");

-- CreateIndex
CREATE INDEX "balasan_buku_penghubung_bukuPenghubungId_idx" ON "balasan_buku_penghubung"("bukuPenghubungId");

-- CreateIndex
CREATE INDEX "balasan_buku_penghubung_penulisId_idx" ON "balasan_buku_penghubung"("penulisId");

-- AddForeignKey
ALTER TABLE "buku_penghubung" ADD CONSTRAINT "buku_penghubung_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buku_penghubung" ADD CONSTRAINT "buku_penghubung_waliKelasId_fkey" FOREIGN KEY ("waliKelasId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balasan_buku_penghubung" ADD CONSTRAINT "balasan_buku_penghubung_bukuPenghubungId_fkey" FOREIGN KEY ("bukuPenghubungId") REFERENCES "buku_penghubung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balasan_buku_penghubung" ADD CONSTRAINT "balasan_buku_penghubung_penulisId_fkey" FOREIGN KEY ("penulisId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
