-- CreateTable
CREATE TABLE "koperasi_item" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "harga" DECIMAL(15,2) NOT NULL,
    "stok" INTEGER NOT NULL DEFAULT 0,
    "kategori" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "koperasi_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "koperasi_transaksi" (
    "id" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "hargaSatuan" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "walletTransactionId" TEXT,
    "serverTimestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "koperasi_transaksi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "koperasi_item_isActive_idx" ON "koperasi_item"("isActive");

-- CreateIndex
CREATE INDEX "koperasi_transaksi_santriId_idx" ON "koperasi_transaksi"("santriId");

-- CreateIndex
CREATE INDEX "koperasi_transaksi_itemId_idx" ON "koperasi_transaksi"("itemId");

-- CreateIndex
CREATE INDEX "koperasi_transaksi_serverTimestamp_idx" ON "koperasi_transaksi"("serverTimestamp");

-- AddForeignKey
ALTER TABLE "koperasi_transaksi" ADD CONSTRAINT "koperasi_transaksi_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "koperasi_transaksi" ADD CONSTRAINT "koperasi_transaksi_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "koperasi_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
