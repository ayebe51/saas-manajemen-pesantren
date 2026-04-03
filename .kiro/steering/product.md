# Product: Aplikasi Manajemen Pesantren Enterprise

A single-tenant, perpetual-license enterprise management platform for Islamic boarding schools (pesantren). Deployed on-premise or on a customer's VPS/private cloud.

## Core Purpose
Manage all pesantren operations in one integrated system: student data, academics, attendance, finance, health, dormitory, staffing, and parent communication.

## Business Model
- Perpetual license (jual putus) — not SaaS subscription
- On-premise / VPS deployment
- Must function for core operations without internet (offline-capable)
- License tied to hardware fingerprint; online verification with 30-day grace period offline

## Key Modules (19 total)
Dashboard, Kesantrian (Student Management), PPDB (Enrollment), Akademik, Buku Penghubung (Parent Communication), Pelanggaran (Violations), Kesehatan (Health), Kunjungan (Visitation), Presensi (Attendance via QR+GPS), Poin Reward, Keuangan (Finance), Pembayaran SPP, Top-Up Saldo, Koperasi (Cooperative Store), Perizinan (Leave Permits), Asrama (Dormitory), Kepegawaian (HR), E-ID Card, Laporan (Reports)

## User Roles
Super_Admin, Admin_Pesantren, Wali_Kelas, Petugas_Keuangan, Petugas_Kesehatan, Petugas_Asrama, Santri, Wali_Santri, Owner

## Key Integrations
- WhatsApp notifications (Fonnte, Twilio, Wablas — swappable via Provider_Adapter)
- File storage: local or AWS S3
- Payment: Midtrans, Stripe
- Push notifications: Firebase
- Error tracking: Sentry

## Language Note
The domain language is Indonesian. Variable names, module names, and UI labels often use Bahasa Indonesia (e.g., `santri`, `wali`, `perizinan`, `pelanggaran`). Preserve this naming convention.
