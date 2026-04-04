-- Migration: add_wa_queue
-- Adds wa_queue table for WhatsApp notification queue engine
-- Requirements: 18.1, 18.4

CREATE TABLE "wa_queue" (
    "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipeNotifikasi" TEXT NOT NULL,
    "noTujuan"       TEXT NOT NULL,
    "templateKey"    TEXT NOT NULL,
    "payload"        JSONB NOT NULL,
    "status"         TEXT NOT NULL DEFAULT 'PENDING',
    "retryCount"     INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt"    TIMESTAMPTZ,
    "sentAt"         TIMESTAMPTZ,
    "errorMessage"   TEXT,
    "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_queue_pkey" PRIMARY KEY ("id")
);

-- Composite index for worker polling: status + nextRetryAt
-- Partial index only for rows that need processing
CREATE INDEX "wa_queue_status_nextRetryAt_idx" ON "wa_queue"("status", "nextRetryAt")
    WHERE "status" IN ('PENDING', 'RETRYING');

-- wa_templates table for Template Engine
CREATE TABLE "wa_templates" (
    "id"        UUID NOT NULL DEFAULT gen_random_uuid(),
    "key"       TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "isActive"  BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wa_templates_key_key" ON "wa_templates"("key");

-- Seed default templates for 8 notification types (Requirement 18.8)
INSERT INTO "wa_templates" ("id", "key", "body", "isActive", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'PRESENSI_MASUK',
 'Assalamu''alaikum {{wali_nama}}, santri {{santri_nama}} telah hadir pada sesi {{sesi_nama}} pukul {{waktu}}. Terima kasih.',
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'PRESENSI_KELUAR',
 'Assalamu''alaikum {{wali_nama}}, santri {{santri_nama}} telah keluar pada sesi {{sesi_nama}} pukul {{waktu}}.',
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'PEMBAYARAN_BERHASIL',
 'Pembayaran SPP {{bulan}} untuk {{santri_nama}} sebesar Rp{{jumlah}} telah diterima. No. Invoice: {{invoice_number}}.',
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'PELANGGARAN',
 'Yth. {{wali_nama}}, santri {{santri_nama}} tercatat melakukan pelanggaran: {{pelanggaran_nama}} pada {{tanggal}}. Poin pelanggaran: {{total_poin}}.',
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'REWARD',
 'Selamat! Santri {{santri_nama}} mendapatkan poin reward sebesar {{poin}} poin karena {{alasan}} pada {{tanggal}}. Total poin: {{total_poin}}.',
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'IZIN_DISETUJUI',
 'Yth. {{wali_nama}}, izin santri {{santri_nama}} telah DISETUJUI. Periode: {{tanggal_mulai}} s/d {{tanggal_selesai}}.',
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'IZIN_DITOLAK',
 'Yth. {{wali_nama}}, izin santri {{santri_nama}} DITOLAK. Alasan: {{alasan_penolakan}}.',
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'KUNJUNGAN',
 'Yth. {{wali_nama}}, ada kunjungan tamu untuk santri {{santri_nama}} pada {{waktu}}. Tamu: {{nama_tamu}} ({{hubungan}}).',
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'BUKU_PENGHUBUNG',
 'Yth. {{wali_nama}}, Wali Kelas {{wali_kelas_nama}} telah membuat catatan baru untuk santri {{santri_nama}}: "{{isi_catatan}}".',
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'TOPUP_BERHASIL',
 'Top-up saldo santri {{santri_nama}} sebesar Rp{{jumlah}} berhasil. Saldo terkini: Rp{{saldo_terkini}}.',
 true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
