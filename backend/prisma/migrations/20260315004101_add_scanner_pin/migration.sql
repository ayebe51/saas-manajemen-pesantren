/*
  Warnings:

  - A unique constraint covering the columns `[scannerPin]` on the table `tenants` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "scannerPin" TEXT;

-- CreateTable
CREATE TABLE "points" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "points_tenantId_idx" ON "points"("tenantId");

-- CreateIndex
CREATE INDEX "points_santriId_idx" ON "points"("santriId");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_scannerPin_key" ON "tenants"("scannerPin");

-- AddForeignKey
ALTER TABLE "points" ADD CONSTRAINT "points_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points" ADD CONSTRAINT "points_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;
