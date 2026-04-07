# Rencana Implementasi: Aplikasi Manajemen Pesantren Enterprise

## Ikhtisar

Implementasi dilakukan secara bertahap mengikuti urutan prioritas build order. Setiap fase membangun di atas fase sebelumnya. Stack: NestJS + TypeScript + Prisma ORM + PostgreSQL + Redis + BullMQ. Testing: Jest + fast-check (property-based testing).

## Tasks

---

### Fase 1: Auth + RBAC + Lisensi

- [x] 1. Setup infrastruktur proyek dan konfigurasi dasar
  - Inisialisasi Prisma schema dengan tabel `users`, `roles`, `permissions`, `refresh_tokens`, `login_attempts`, `license`, `audit_logs`
  - Konfigurasi `PrismaService`, `ConfigModule`, `ThrottlerModule`, `JwtModule`
  - Setup `docker-compose.yml` dengan service: api, worker, postgres, redis, nginx
  - Buat file `.env.example` dengan semua variabel yang diperlukan
  - _Requirements: 22.4, 22.5_

- [x] 2. Implementasi modul Auth
  - [x] 2.1 Implementasi `AuthService`: login, refresh token, logout
    - Validasi kredensial, hash bcrypt/argon2 (cost factor 12), penerbitan JWT access token (15 menit) + refresh token (7 hari)
    - Simpan refresh token sebagai hash di tabel `refresh_tokens`
    - Deteksi reuse refresh token: batalkan seluruh sesi user
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.7_
  - [x] 2.2 Property test: Kredensial invalid selalu 401 tanpa detail akun
    - **Property 1: Kredensial Invalid Selalu Menghasilkan 401 Tanpa Detail Akun**
    - **Validates: Requirements 1.2**
  - [x] 2.3 Property test: Token lifecycle — refresh dan invalidasi setelah logout
    - **Property 2: Token Lifecycle — Refresh Setelah Expire, Invalidasi Setelah Logout**
    - **Validates: Requirements 1.3, 1.5**
  - [x] 2.4 Property test: Refresh token reuse membatalkan seluruh sesi
    - **Property 3: Refresh Token Reuse Membatalkan Seluruh Sesi**
    - **Validates: Requirements 1.4**
  - [x] 2.5 Property test: Hash password unik per pengguna
    - **Property 5: Hash Password Unik per Pengguna**
    - **Validates: Requirements 1.7**

- [x] 3. Implementasi rate limiting login dan audit log auth
  - [x] 3.1 Implementasi rate limiting login: 10 percobaan gagal/menit per IP → lockout 15 menit
    - Gunakan tabel `login_attempts` + Redis counter
    - `ThrottlerGuard` untuk endpoint publik (100 req/menit user, 30 req/menit IP)
    - _Requirements: 1.6, 22.7_
  - [x] 3.2 Property test: Rate limiting login berlaku konsisten per IP
    - **Property 4: Rate Limiting Login Berlaku Konsisten per IP**
    - **Validates: Requirements 1.6**
  - [x] 3.3 Implementasi `AuditLogService` dan `AuditLogInterceptor`
    - Insert-only ke tabel `audit_logs` dengan `server_timestamp`, `user_id`, `ip_address`, `aksi`, `nilai_sebelum`, `nilai_sesudah`
    - Catat login berhasil, login gagal, logout
    - _Requirements: 1.8, 20.1, 20.2, 20.4_
  - [x] 3.4 Property test: Audit log mencatat semua aksi auth
    - **Property 6: Audit Log Mencatat Semua Aksi Auth**
    - **Validates: Requirements 1.8, 20.2**
  - [x] 3.5 Property test: Audit log immutable
    - **Property 21: Audit Log Immutable**
    - **Validates: Requirements 20.3**

- [x] 4. Implementasi modul RBAC
  - [x] 4.1 Implementasi `RbacService`: CRUD role dan permission
    - Seed 9 role default: Super_Admin, Admin_Pesantren, Wali_Kelas, Petugas_Keuangan, Petugas_Kesehatan, Petugas_Asrama, Santri, Wali_Santri, Owner
    - Matriks permission per modul (can_read, can_write) untuk 19 modul
    - _Requirements: 2.1, 2.5_
  - [x] 4.2 Implementasi `RolesGuard` dan `JwtAuthGuard`
    - Dekorator `@Roles()`, `@CurrentUser()`, `@Public()`
    - Verifikasi permission dari database (bukan dari JWT payload) agar perubahan langsung berlaku
    - _Requirements: 2.3, 2.4, 2.6_
  - [x] 4.3 Property test: RBAC enforcement — akses sesuai permission
    - **Property 7: RBAC Enforcement — Akses Sesuai Permission**
    - **Validates: Requirements 2.3, 2.4**
  - [x] 4.4 Property test: Satu user satu role aktif
    - **Property 8: Satu User Satu Role Aktif**
    - **Validates: Requirements 2.2**
  - [x] 4.5 Property test: Perubahan permission role berlaku langsung
    - **Property 9: Perubahan Permission Role Berlaku Langsung**
    - **Validates: Requirements 2.6**

- [x] 5. Implementasi modul Lisensi
  - [x] 5.1 Implementasi `LicenseService`: aktivasi online, verifikasi offline, grace period
    - Generate `hardware_fingerprint` (SHA-256 dari hostname + MAC + CPU model)
    - Simpan bukti aktivasi lokal (encrypted) di tabel `license`
    - Grace period 30 hari dari `last_verified_at`; setelah habis → mode read-only
    - `LicenseGuard` diintegrasikan ke pipeline request
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_
  - [x] 5.2 Property test: Grace period lisensi offline
    - **Property 20: Grace Period Lisensi Offline**
    - **Validates: Requirements 19.3, 19.4**
  - [x] 5.3 Implementasi cron job `LicenseCheckerJob`
    - Verifikasi online periodik; update `last_verified_at`; catat ke audit log
    - _Requirements: 19.6_

- [x] 6. Checkpoint Fase 1 — Pastikan semua test lulus
  - Pastikan semua unit test dan property test Fase 1 lulus, tanyakan kepada user jika ada pertanyaan.


---

### Fase 2: Master Data Santri, Wali, User, Role, Permission

- [x] 7. Implementasi modul Santri dan Wali Santri
  - [x] 7.1 Prisma migration: tabel `santri`, `wali_santri`, `santri_wali`
    - Kolom lengkap sesuai desain; soft delete via `deleted_at`; UNIQUE constraint pada `nis`
    - _Requirements: 3.1, 3.2, 3.3_
  - [x] 7.2 Implementasi `SantriService`: CRUD santri dengan soft delete
    - Validasi NIS unik, pencarian by nama/NIS/kelas/status, relasi one-to-many wali
    - Catat perubahan ke audit log (nilai sebelum dan sesudah)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [x] 7.3 Implementasi `SantriController` dengan DTO dan validasi
    - Endpoint: GET `/santri`, POST `/santri`, GET `/santri/:id`, PUT `/santri/:id`, DELETE `/santri/:id`, GET `/santri/:id/history`
    - Guard: JWT + RolesGuard per endpoint
    - _Requirements: 3.1, 3.6_
  - [ ]* 7.4 Unit test: CRUD santri, soft delete, pencarian, audit log
    - Test validasi NIS duplikat, soft delete tidak menghapus data historis
    - _Requirements: 3.2, 3.3, 3.5_

- [x] 8. Implementasi pembatasan akses Wali Santri
  - [x] 8.1 Implementasi filter data santri berdasarkan relasi `santri_wali` untuk role Wali_Santri
    - Middleware/guard yang memastikan Wali_Santri hanya melihat santri tanggungannya
    - _Requirements: 2.7_
  - [ ]* 8.2 Property test: Wali santri hanya akses data santri sendiri
    - **Property 10: Wali Santri Hanya Akses Data Santri Sendiri**
    - **Validates: Requirements 2.7**

- [x] 9. Implementasi manajemen User dan audit RBAC
  - [x] 9.1 Implementasi endpoint manajemen user: buat, update, nonaktifkan
    - Saat user dinonaktifkan: revoke semua refresh token aktif
    - Catat perubahan RBAC ke audit log
    - _Requirements: 2.8, 16.2_
  - [ ]* 9.2 Unit test: Nonaktifkan user merevoke sesi aktif
    - _Requirements: 16.2_

- [x] 10. Checkpoint Fase 2 — Pastikan semua test lulus
  - Pastikan semua unit test dan property test Fase 2 lulus, tanyakan kepada user jika ada pertanyaan.

---

### Fase 3: Presensi QR + GPS + Audit

- [x] 11. Implementasi modul Presensi
  - [x] 11.1 Prisma migration: tabel `presensi_sessions`, `presensi_records`
    - UNIQUE constraint `(session_id, santri_id)` untuk idempotency
    - _Requirements: 5.1, 5.8_
  - [x] 11.2 Implementasi `QrTokenService`: generate dan validasi QR token
    - QR token unik, TTL 5 menit berdasarkan `server_timestamp`
    - Simpan token di Redis dengan TTL; tandai sebagai used setelah scan pertama
    - _Requirements: 5.1, 5.2, 5.3_
  - [x] 11.3 Implementasi `GpsValidatorService`: validasi koordinat GPS
    - Hitung jarak Haversine dari koordinat sesi; tolak jika di luar radius
    - Tandai PENDING_REVIEW jika akurasi GPS > 50 meter
    - _Requirements: 5.4, 5.5, 5.6_
  - [x] 11.4 Implementasi `PresensiService` dan `PresensiController`
    - Endpoint: POST `/attendance/sessions`, GET `/attendance/sessions/:id/qr`, POST `/attendance/scan`, GET `/attendance/sessions/:id/records`, GET `/attendance/santri/:id`
    - Gunakan `server_timestamp` (bukan client timestamp) untuk semua record
    - Idempotency: scan ulang sesi yang sama mengembalikan record existing
    - Catat semua percobaan presensi ke audit log
    - _Requirements: 5.7, 5.8, 5.9, 5.11_
  - [x]* 11.5 Property test: QR token idempotency dan one-time-use
    - **Property 11: QR Token Idempotency dan One-Time-Use**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.8**
  - [x]* 11.6 Property test: GPS validation konsisten dengan radius konfigurasi
    - **Property 12: GPS Validation Konsisten dengan Radius Konfigurasi**
    - **Validates: Requirements 5.4, 5.5, 5.6**
  - [x]* 11.7 Property test: Server timestamp selalu digunakan untuk presensi
    - **Property 13: Server Timestamp Selalu Digunakan untuk Presensi**
    - **Validates: Requirements 5.7**
  - [x]* 11.8 Unit test: QR expired → 410, scan duplikat → idempotent, GPS di luar radius → ditolak
    - _Requirements: 5.3, 5.6, 5.8_

- [x] 12. Checkpoint Fase 3 — Pastikan semua test lulus
  - Pastikan semua unit test dan property test Fase 3 lulus, tanyakan kepada user jika ada pertanyaan.

---

### Fase 4: WhatsApp Queue Engine

- [x] 13. Implementasi modul WA Engine
  - [x] 13.1 Prisma migration: tabel `wa_queue` dengan index `(status, next_retry_at)`
    - Status: PENDING, RETRYING, SENT, FAILED, DLQ
    - _Requirements: 18.1, 18.4_
  - [x] 13.2 Implementasi `WaQueueService`: enqueue pesan ke tabel `wa_queue`
    - Insert asinkron; tidak memblokir operasi bisnis utama
    - _Requirements: 18.1_
  - [x] 13.3 Implementasi `WaWorker` dengan BullMQ
    - Poll pesan PENDING/RETRYING; kirim via `ProviderAdapter`
    - Update status ke SENT atau RETRYING dengan `next_retry_at` (exponential backoff + jitter 10%)
    - Setelah 5 kali gagal: pindahkan ke DLQ
    - _Requirements: 18.2, 18.3_
  - [x] 13.4 Implementasi `ProviderAdapter` interface dan minimal satu implementasi konkret
    - Interface: `send(to, message)`, `getStatus(messageId)`
    - Implementasi: `FonnteAdapter` atau `CustomHttpAdapter` (dikonfigurasi via `WA_PROVIDER` env)
    - _Requirements: 18.6, 18.7_
  - [x] 13.5 Implementasi `TemplateEngine`: render template dengan variabel dinamis
    - Template disimpan di database; variabel `{{variable}}`
    - Minimal 8 jenis notifikasi: presensi, pembayaran, pelanggaran, reward, izin, kunjungan, buku penghubung, top-up
    - _Requirements: 18.5, 18.8_
  - [ ]* 13.6 Property test: Retry backoff mengikuti kebijakan exponential
    - **Property 19: Retry Backoff Mengikuti Kebijakan Exponential**
    - **Validates: Requirements 18.2, 18.3**
  - [ ]* 13.7 Unit test: Kegagalan WA tidak menggagalkan operasi bisnis utama
    - _Requirements: 18.7_

- [x] 14. Checkpoint Fase 4 — Pastikan semua test lulus
  - Pastikan semua unit test dan property test Fase 4 lulus, tanyakan kepada user jika ada pertanyaan.


---

### Fase 5: Keuangan + SPP + Top-Up

- [x] 15. Implementasi modul Pembayaran dan Wallet
  - [x] 15.1 Prisma migration: tabel `invoices`, `wallets`, `wallet_transactions`
    - UNIQUE constraint pada `invoice_number`; CHECK constraint `saldo >= 0` pada `wallets`
    - _Requirements: 11.1, 12.2_
  - [x] 15.2 Implementasi `InvoiceService`: buat invoice, konfirmasi pembayaran
    - Generate nomor invoice unik (format: INV-YYYYMM-XXXXX)
    - Konfirmasi pembayaran: gunakan `SELECT FOR UPDATE` + idempotency key (`X-Idempotency-Key` header) untuk mencegah race condition
    - Transisi status sesuai state machine: PENDING → PAID/EXPIRED/CANCELLED, PAID → REFUNDED
    - Catat semua transaksi ke audit log
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6_
  - [x] 15.3 Implementasi `WalletService`: top-up dan debit saldo secara atomik
    - Gunakan database transaction untuk atomicity; insert `wallet_transactions` bersamaan dengan update `wallets.saldo`
    - Tolak debit jika saldo tidak cukup (HTTP 422)
    - _Requirements: 12.2, 13.2, 13.3_
  - [x] 15.4 Implementasi `PembayaranController` dengan DTO dan validasi
    - Endpoint: POST `/pembayaran/invoices`, GET `/pembayaran/invoices`, POST `/pembayaran/invoices/:id/confirm`, POST `/pembayaran/topup`, GET `/pembayaran/wallet/:santriId`
    - Kirim notifikasi WA setelah pembayaran berhasil dan top-up berhasil
    - _Requirements: 11.5, 12.3_
  - [x] 15.5 Implementasi cron job `InvoiceExpiryJob`
    - Tandai invoice PENDING yang melewati `due_date` menjadi EXPIRED
    - _Requirements: 11.2_
  - [ ]* 15.6 Property test: Invoice number unik
    - **Property 14: Invoice Number Unik**
    - **Validates: Requirements 11.1**
  - [ ]* 15.7 Property test: Transisi status invoice mengikuti state machine
    - **Property 15: Transisi Status Invoice Mengikuti State Machine**
    - **Validates: Requirements 11.2**
  - [ ]* 15.8 Property test: Konfirmasi pembayaran idempoten (race condition safe)
    - **Property 16: Konfirmasi Pembayaran Idempoten (Race Condition Safe)**
    - **Validates: Requirements 11.4**
  - [ ]* 15.9 Property test: Atomicity transaksi saldo
    - **Property 17: Atomicity Transaksi Saldo**
    - **Validates: Requirements 12.2, 13.2**
  - [ ]* 15.10 Unit test: Konfirmasi invoice sudah PAID → 409, saldo tidak cukup → 422, jumlah negatif → 400
    - _Requirements: 11.4, 13.3_

- [x] 16. Checkpoint Fase 5 — Pastikan semua test lulus
  - Pastikan semua unit test dan property test Fase 5 lulus, tanyakan kepada user jika ada pertanyaan.

---

### Fase 6: Perizinan + Pelanggaran + Reward

- [x] 17. Implementasi modul Perizinan
  - [x] 17.1 Prisma migration: tabel `perizinan`
    - Status: DRAFT, SUBMITTED, APPROVED, REJECTED, COMPLETED, CANCELLED, TERLAMBAT
    - _Requirements: 14.1_
  - [x] 17.2 Implementasi `PerizinanService`: state machine izin
    - Transisi status sesuai state machine; tolak transisi tidak valid (HTTP 400)
    - Kirim notifikasi WA saat APPROVED/REJECTED
    - Catat setiap perubahan status ke audit log
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
  - [x] 17.3 Implementasi `PerizinanController` dengan DTO
    - Endpoint: POST `/perizinan`, GET `/perizinan`, PUT `/perizinan/:id/approve`, PUT `/perizinan/:id/reject`, PUT `/perizinan/:id/complete`
    - _Requirements: 14.2, 14.4_
  - [x] 17.4 Implementasi cron job `PerizinanLateCheckJob`
    - Tandai izin APPROVED yang melewati `tanggal_selesai` sebagai TERLAMBAT; kirim notifikasi ke Admin_Pesantren
    - _Requirements: 14.6_
  - [ ]* 17.5 Property test: Transisi status perizinan mengikuti state machine
    - **Property 18: Transisi Status Perizinan Mengikuti State Machine**
    - **Validates: Requirements 14.1**
  - [ ]* 17.6 Unit test: Transisi status tidak valid → 400, notifikasi WA saat APPROVED/REJECTED
    - _Requirements: 14.1, 14.3_

- [x] 18. Implementasi modul Pelanggaran dan Poin Reward
  - [x] 18.1 Prisma migration: tabel `pelanggaran`, `reward_poin`, `kategori_pelanggaran`
    - Kolom: `santri_id`, `kategori_id`, `tingkat_keparahan`, `poin`, `server_timestamp`, `created_by`
    - _Requirements: 8.1, 8.4_
  - [x] 18.2 Implementasi `PelanggaranService` dan `RewardService`
    - Hitung akumulasi poin pelanggaran per santri; trigger tindakan otomatis saat ambang batas tercapai
    - Kirim notifikasi WA ke Wali_Santri saat pelanggaran/reward dicatat
    - Catat ke audit log
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  - [ ]* 18.3 Unit test: Akumulasi poin, trigger ambang batas, notifikasi WA
    - _Requirements: 8.2, 8.3_

- [x] 19. Checkpoint Fase 6 — Pastikan semua test lulus
  - Pastikan semua unit test dan property test Fase 6 lulus, tanyakan kepada user jika ada pertanyaan.

---

### Fase 7: Kesehatan + Kunjungan + Asrama

- [x] 20. Implementasi modul Kesehatan
  - [x] 20.1 Prisma migration: tabel `rekam_medis`, `kunjungan_klinik`
    - Kolom rekam medis: `santri_id`, `riwayat_penyakit`, `alergi`, `catatan`
    - Kolom kunjungan: `santri_id`, `keluhan`, `diagnosis`, `tindakan`, `server_timestamp`
    - _Requirements: 9.1, 9.2_
  - [x] 20.2 Implementasi `KesehatanService` dan `KesehatanController`
    - Batasi akses hanya untuk Petugas_Kesehatan, Admin_Pesantren, Super_Admin
    - Kirim notifikasi WA untuk kondisi yang memerlukan perhatian khusus
    - _Requirements: 9.2, 9.3, 9.4_
  - [ ]* 20.3 Unit test: Akses rekam medis oleh role tidak berwenang → 403
    - _Requirements: 9.4_

- [x] 21. Implementasi modul Kunjungan Tamu
  - [x] 21.1 Prisma migration: tabel `kunjungan_tamu`
    - Kolom: `santri_id`, `nama_tamu`, `hubungan`, `waktu_masuk`, `waktu_keluar`
    - _Requirements: 10.1_
  - [x] 21.2 Implementasi `KunjunganService` dan `KunjunganController`
    - Kirim notifikasi WA ke Wali_Santri saat kunjungan dicatat
    - _Requirements: 10.1, 10.2_

- [x] 22. Implementasi modul Asrama
  - [x] 22.1 Prisma migration: tabel `asrama`, `kamar`, `penempatan_santri`
    - Kolom kamar: `nama`, `kapasitas`, `lantai`, `status`; riwayat penempatan dengan `tanggal_masuk`, `tanggal_keluar`
    - _Requirements: 15.1, 15.4_
  - [x] 22.2 Implementasi `AsramaService` dan `AsramaController`
    - Validasi kapasitas kamar sebelum penempatan; tolak jika penuh (HTTP 422)
    - Catat riwayat perpindahan kamar tanpa menghapus data lama
    - _Requirements: 15.2, 15.3, 15.4_
  - [ ]* 22.3 Unit test: Penempatan melebihi kapasitas → 422, riwayat perpindahan tersimpan
    - _Requirements: 15.2, 15.3, 15.4_

- [x] 23. Checkpoint Fase 7 — Pastikan semua test lulus
  - Pastikan semua unit test dan property test Fase 7 lulus, tanyakan kepada user jika ada pertanyaan.


---

### Fase 8: Akademik + Buku Penghubung + E-ID Card

- [x] 24. Implementasi modul Akademik
  - [x] 24.1 Prisma migration: tabel `kelas`, `mata_pelajaran`, `jadwal_pelajaran`, `nilai_santri`
    - Kolom nilai: `santri_id`, `mapel_id`, `periode`, `nilai` (CHECK 0–100), `created_by`
    - _Requirements: 6.1, 6.2_
  - [x] 24.2 Implementasi `AkademikService` dan `AkademikController`
    - Validasi nilai dalam rentang yang dikonfigurasi (default 0–100)
    - Validasi konflik jadwal untuk kelas dan pengajar yang sama
    - _Requirements: 6.2, 6.4_
  - [ ]* 24.3 Unit test: Nilai di luar rentang → 400, konflik jadwal → 400
    - _Requirements: 6.2, 6.4_

- [x] 25. Implementasi modul Buku Penghubung
  - [x] 25.1 Prisma migration: tabel `buku_penghubung`, `balasan_buku_penghubung`
    - Kolom: `santri_id`, `wali_kelas_id`, `isi`, `server_timestamp`; tidak ada soft delete
    - _Requirements: 7.1, 7.4_
  - [x] 25.2 Implementasi `BukuPenghubungService` dan `BukuPenghubungController`
    - Kirim notifikasi WA ke Wali_Santri saat catatan baru dibuat
    - Simpan balasan Wali_Santri dan tampilkan ke Wali_Kelas
    - _Requirements: 7.2, 7.3, 7.4_

- [x] 26. Implementasi modul PPDB
  - [x] 26.1 Prisma migration: tabel `ppdb_pendaftaran`
    - Status: DRAFT, SUBMITTED, REVIEW, ACCEPTED, REJECTED
    - Kolom: `nomor_pendaftaran` (UNIQUE), `data_calon` (JSONB), `status`, `created_at`
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 26.2 Implementasi `PpdbService` dan `PpdbController`
    - Generate nomor pendaftaran unik; kirim notifikasi WA saat status berubah
    - Konversi data pendaftaran ACCEPTED menjadi data santri aktif (tanpa input ulang)
    - _Requirements: 4.2, 4.4, 4.5_

- [x] 27. Implementasi modul E-ID Card
  - [x] 27.1 Implementasi `EidService`: generate E-ID Card PDF
    - Gunakan `pdfmake` untuk generate PDF dengan foto, nama, NIS, kelas, QR code verifikasi
    - QR code berisi URL verifikasi yang dapat dipindai
    - Regenerasi saat data santri diperbarui
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
  - [x] 27.2 Implementasi `EidController`
    - Endpoint: GET `/eid/:santriId` (download PDF), POST `/eid/:santriId/regenerate`
    - _Requirements: 17.2, 17.4_

- [x] 28. Implementasi modul Kepegawaian
  - [x] 28.1 Prisma migration: tabel `pegawai`, `presensi_pegawai`
    - Kolom pegawai: `nama`, `jabatan`, `tanggal_bergabung`, `status_aktif`, `user_id`
    - _Requirements: 16.1, 16.3_
  - [x] 28.2 Implementasi `KepegawaianService` dan `KepegawaianController`
    - Nonaktifkan pegawai: revoke semua refresh token user terkait secara bersamaan
    - Presensi pegawai terpisah dari presensi santri
    - _Requirements: 16.1, 16.2, 16.3_

- [x] 29. Implementasi modul Koperasi
  - [x] 29.1 Prisma migration: tabel `koperasi_item`, `koperasi_transaksi`
    - Kolom item: `nama`, `harga`, `stok`, `kategori`
    - _Requirements: 13.1_
  - [x] 29.2 Implementasi `KoperasiService` dan `KoperasiController`
    - Transaksi pembelian: debit saldo santri + kurangi stok secara atomik (database transaction)
    - Tolak jika saldo tidak cukup (HTTP 422) atau stok habis (HTTP 422)
    - _Requirements: 13.2, 13.3, 13.4_
  - [ ]* 29.3 Unit test: Saldo tidak cukup → 422, stok habis → 422
    - _Requirements: 13.3, 13.4_

- [x] 30. Checkpoint Fase 8 — Pastikan semua test lulus
  - Pastikan semua unit test dan property test Fase 8 lulus, tanyakan kepada user jika ada pertanyaan.

---

### Fase 9: Laporan + Dashboard

- [x] 31. Implementasi modul Laporan
  - [x] 31.1 Implementasi `ReportWorker` dengan BullMQ
    - Job queue untuk generate laporan besar secara asinkron
    - Simpan hasil laporan ke file storage (S3/local); kirim notifikasi ke user saat siap
    - _Requirements: 21.4_
  - [x] 31.2 Implementasi `LaporanService` dan `LaporanController`
    - Ekspor PDF (pdfmake) dan Excel (exceljs) untuk semua modul relevan
    - Filter berdasarkan rentang tanggal, kelas, asrama, dan parameter per jenis laporan
    - Modul laporan: santri, presensi, keuangan, pelanggaran, kesehatan, kunjungan, asrama, kepegawaian, koperasi
    - _Requirements: 21.3, 21.5_
  - [ ]* 31.3 Unit test: Generate laporan PDF dan Excel, filter parameter
    - _Requirements: 21.3, 21.5_

- [x] 32. Implementasi modul Dashboard
  - [x] 32.1 Implementasi `DashboardService`
    - Agregasi data: jumlah santri aktif, rekap presensi hari ini, tagihan jatuh tempo, notifikasi terbaru
    - Gunakan Redis cache dengan TTL pendek untuk mempercepat response < 2 detik (p95)
    - _Requirements: 21.1, 21.2_
  - [x] 32.2 Implementasi `DashboardController`
    - Endpoint: GET `/dashboard/summary`
    - _Requirements: 21.1_

- [x] 33. Implementasi modul Audit Log (endpoint query)
  - [x] 33.1 Implementasi `AuditLogController`
    - Endpoint: GET `/audit-logs` dengan filter: jenis aksi, rentang waktu, user_id
    - Akses hanya untuk Super_Admin dan Owner
    - _Requirements: 20.5_

- [x] 34. Checkpoint Fase 9 — Pastikan semua test lulus
  - Pastikan semua unit test dan property test Fase 9 lulus, tanyakan kepada user jika ada pertanyaan.

---

### Fase 10: Hardening, Test, Deployment

- [ ] 35. Hardening keamanan dan non-fungsional
  - [ ] 35.1 Implementasi anti-replay pada endpoint presensi dan pembayaran
    - Presensi: QR token one-time-use via Redis (sudah di Fase 3)
    - Pembayaran: validasi `X-Idempotency-Key` header (sudah di Fase 5)
    - Verifikasi semua endpoint sensitif menggunakan nonce/idempotency key
    - _Requirements: 22.2_
  - [ ] 35.2 Konfigurasi Nginx: HTTPS, TLS termination, rate limiting header
    - Pastikan semua komunikasi via HTTPS; konfigurasi `helmet` di NestJS
    - _Requirements: 22.1_
  - [ ] 35.3 Implementasi backup otomatis harian
    - Cron job atau script `pg_dump` harian; retensi 30 hari; simpan ke `/backup/`
    - _Requirements: 22.6_
  - [ ] 35.4 Verifikasi error handling: tidak mengekspos stack trace ke client
    - Implementasi global exception filter yang menyembunyikan detail error dari response
    - _Requirements: 22.8_

- [ ] 36. Integrasi akhir dan wiring semua modul
  - [ ] 36.1 Pastikan semua modul terdaftar di `AppModule`
    - Verifikasi dependency injection antar modul (Santri → Presensi, Pembayaran → Wallet, dst.)
    - _Requirements: semua_
  - [ ] 36.2 Implementasi Prisma seed data awal
    - Seed: 9 role default, matriks permission 19 modul, user Super_Admin default, template WA
    - _Requirements: 2.1, 2.5_
  - [ ] 36.3 Finalisasi `docker-compose.yml` dan konfigurasi deployment
    - Service: nginx, api, worker, postgres, redis; volume untuk pgdata, redisdata, backup
    - _Requirements: 22.4_

- [ ] 37. Final checkpoint — Pastikan semua test lulus
  - Jalankan seluruh test suite (unit + property-based); pastikan semua lulus. Tanyakan kepada user jika ada pertanyaan.

---

## Catatan

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk keterlacakan
- Property test menggunakan fast-check dengan minimum 100 iterasi (`numRuns: 100`)
- Setiap property test harus memiliki komentar tag: `// Feature: pesantren-management-app, Property {N}: {deskripsi}`
- Semua timestamp kritikal menggunakan `server_timestamp` (bukan client timestamp)
- Audit log bersifat insert-only; tidak ada UPDATE atau DELETE yang diizinkan
