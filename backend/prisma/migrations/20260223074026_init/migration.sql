-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "adminUserId" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    "plan" TEXT NOT NULL DEFAULT 'BASIC',
    "billingContact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PENGURUS',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "santri" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "nisn" TEXT,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dob" DATETIME,
    "kelas" TEXT,
    "room" TEXT,
    "contact" TEXT,
    "address" TEXT,
    "photo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "santri_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "wali" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wali_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "santri_wali" (
    "santriId" TEXT NOT NULL,
    "waliId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("santriId", "waliId"),
    CONSTRAINT "santri_wali_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "santri_wali_waliId_fkey" FOREIGN KEY ("waliId") REFERENCES "wali" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "izin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "qrCodeData" TEXT,
    "checkoutAt" DATETIME,
    "checkoutBy" TEXT,
    "checkinAt" DATETIME,
    "checkinBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "izin_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "izin_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "catatan_harian" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "catatan_harian_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "catatan_harian_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengumuman" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "pinnedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pengumuman_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "amountDue" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoices_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "invoice_lines_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionRef" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pelanggaran" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pelanggaran_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pelanggaran_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pembinaan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "targetDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ONGOING',
    "assignedTo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pembinaan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "pembinaan_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kunjungan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "slot" TEXT NOT NULL,
    "visitorLimit" INTEGER NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kunjungan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "kunjungan_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tamu" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kunjunganId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "idNumber" TEXT,
    "checkinAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tamu_kunjunganId_fkey" FOREIGN KEY ("kunjunganId") REFERENCES "kunjungan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "santriId" TEXT NOT NULL,
    "recordedBy" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "diagnosis" TEXT,
    "actionTaken" TEXT,
    "referred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "health_records_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "santriId" TEXT NOT NULL,
    "medicineName" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "givenBy" TEXT,
    "givenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "medications_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "santri" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ip" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    CONSTRAINT "webhook_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "santri_tenantId_idx" ON "santri"("tenantId");

-- CreateIndex
CREATE INDEX "wali_tenantId_idx" ON "wali"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "izin_qrCodeData_key" ON "izin"("qrCodeData");

-- CreateIndex
CREATE INDEX "izin_tenantId_idx" ON "izin"("tenantId");

-- CreateIndex
CREATE INDEX "izin_santriId_idx" ON "izin"("santriId");

-- CreateIndex
CREATE INDEX "catatan_harian_tenantId_idx" ON "catatan_harian"("tenantId");

-- CreateIndex
CREATE INDEX "catatan_harian_santriId_idx" ON "catatan_harian"("santriId");

-- CreateIndex
CREATE INDEX "pengumuman_tenantId_idx" ON "pengumuman"("tenantId");

-- CreateIndex
CREATE INDEX "invoices_tenantId_idx" ON "invoices"("tenantId");

-- CreateIndex
CREATE INDEX "invoices_santriId_idx" ON "invoices"("santriId");

-- CreateIndex
CREATE INDEX "invoice_lines_invoiceId_idx" ON "invoice_lines"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "pelanggaran_tenantId_idx" ON "pelanggaran"("tenantId");

-- CreateIndex
CREATE INDEX "pelanggaran_santriId_idx" ON "pelanggaran"("santriId");

-- CreateIndex
CREATE INDEX "pembinaan_tenantId_idx" ON "pembinaan"("tenantId");

-- CreateIndex
CREATE INDEX "pembinaan_santriId_idx" ON "pembinaan"("santriId");

-- CreateIndex
CREATE INDEX "kunjungan_tenantId_idx" ON "kunjungan"("tenantId");

-- CreateIndex
CREATE INDEX "kunjungan_santriId_idx" ON "kunjungan"("santriId");

-- CreateIndex
CREATE INDEX "tamu_kunjunganId_idx" ON "tamu"("kunjunganId");

-- CreateIndex
CREATE INDEX "health_records_tenantId_idx" ON "health_records"("tenantId");

-- CreateIndex
CREATE INDEX "health_records_santriId_idx" ON "health_records"("santriId");

-- CreateIndex
CREATE INDEX "medications_santriId_idx" ON "medications"("santriId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "webhook_events_tenantId_idx" ON "webhook_events"("tenantId");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");
