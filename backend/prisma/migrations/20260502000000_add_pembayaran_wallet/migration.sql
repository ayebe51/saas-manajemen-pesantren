-- Migration: add_pembayaran_wallet
-- Adds invoice_number (UNIQUE), saldo fields to wallets (with CHECK saldo >= 0),
-- and saldo_sebelum/saldo_sesudah to wallet_transactions
-- Requirements: 11.1, 12.2

-- Add invoice_number column to invoices (UNIQUE)
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoiceNumber" VARCHAR(50);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tipe" VARCHAR(30) NOT NULL DEFAULT 'SPP';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "jumlah" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMPTZ;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paidBy" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "keterangan" TEXT;

-- Backfill invoiceNumber for existing rows (generate placeholder)
UPDATE "invoices" SET "invoiceNumber" = 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(CAST(FLOOR(RANDOM() * 99999 + 1) AS TEXT), 5, '0')
WHERE "invoiceNumber" IS NULL;

-- Make invoiceNumber NOT NULL and UNIQUE
ALTER TABLE "invoices" ALTER COLUMN "invoiceNumber" SET NOT NULL;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoiceNumber_key" UNIQUE ("invoiceNumber");

-- Add indexes for status and dueDate
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "invoices_dueDate_idx" ON "invoices"("dueDate");

-- Add saldo column to wallets with CHECK constraint (saldo >= 0)
ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "saldo" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_saldo_check" CHECK ("saldo" >= 0);

-- Add saldo tracking columns to wallet_transactions
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "tipe" VARCHAR(20) NOT NULL DEFAULT 'TOPUP';
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "jumlah" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "saldoSebelum" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "saldoSesudah" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "referensiId" TEXT;
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "keterangan" TEXT;
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "serverTimestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
