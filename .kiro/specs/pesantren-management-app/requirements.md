# Dokumen Persyaratan
# Aplikasi Manajemen Pesantren Enterprise

## Pendahuluan

Aplikasi Manajemen Pesantren Enterprise adalah platform manajemen level enterprise untuk mengelola seluruh operasional pesantren secara terpadu dalam satu sistem mandiri (single-tenant, perpetual license). Sistem mencakup 19 modul fungsional: Dashboard, Kesantrian, PPDB, Akademik, Buku Penghubung, Pelanggaran, Kesehatan, Kunjungan, Presensi, Poin Reward, Keuangan, Pembayaran SPP, Top-Up Saldo, Koperasi, Perizinan, Asrama, Kepegawaian, E-ID Card, dan Laporan.

Model bisnis: jual putus / perpetual license. Deployment: on-premise / VPS pelanggan / private cloud. Sistem harus tetap berfungsi untuk operasi inti saat koneksi internet tidak stabil.

## Glosarium

- **System**: Aplikasi Manajemen Pesantren Enterprise secara keseluruhan
- **Auth_Service**: Komponen yang menangani autentikasi dan penerbitan token JWT
- **RBAC_Engine**: Komponen yang mengelola role, permission, dan otorisasi akses
- **Santri_Service**: Komponen yang mengelola data santri dan wali santri
- **Presensi_Service**: Komponen yang mengelola kehadiran santri via QR + GPS
- **QR_Validator**: Komponen yang memvalidasi token QR untuk presensi
- **GPS_Validator**: Komponen yang memvalidasi koordinat GPS untuk presensi
- **Pembayaran_Service**: Komponen yang mengelola transaksi keuangan dan SPP
- **WA_Engine**: Komponen antrian dan pengiriman notifikasi WhatsApp
- **WA_Worker**: Proses background yang memproses antrian notifikasi WhatsApp
- **Template_Engine**: Komponen yang merender template pesan WhatsApp
- **License_Service**: Komponen yang mengelola aktivasi dan verifikasi lisensi
- **Audit_Logger**: Komponen yang mencatat semua aksi kritikal ke audit log
- **Perizinan_Service**: Komponen yang mengelola pengajuan dan persetujuan izin santri
- **Pelanggaran_Service**: Komponen yang mengelola pencatatan pelanggaran dan poin
- **Kesehatan_Service**: Komponen yang mengelola rekam medis dan kunjungan santri
- **Asrama_Service**: Komponen yang mengelola data asrama, kamar, dan penempatan santri
- **Kepegawaian_Service**: Komponen yang mengelola data pegawai/ustadz
- **Koperasi_Service**: Komponen yang mengelola transaksi koperasi pesantren
- **Laporan_Service**: Komponen yang menghasilkan laporan dan ekspor data
- **EID_Service**: Komponen yang menghasilkan E-ID Card digital santri
- **Akademik_Service**: Komponen yang mengelola data kelas, mata pelajaran, dan nilai
- **PPDB_Service**: Komponen yang mengelola penerimaan peserta didik baru
- **Dashboard_Service**: Komponen yang menyajikan ringkasan data operasional
- **Provider_Adapter**: Komponen abstraksi untuk integrasi gateway WhatsApp eksternal
- **Santri**: Peserta didik yang terdaftar di pesantren
- **Wali_Santri**: Orang tua atau wali yang bertanggung jawab atas santri
- **Super_Admin**: Pengguna dengan akses penuh ke seluruh sistem
- **Admin_Pesantren**: Pengguna dengan akses administratif operasional pesantren
- **Wali_Kelas**: Ustadz/ustadzah yang bertanggung jawab atas kelas tertentu
- **Petugas_Keuangan**: Pengguna yang mengelola transaksi keuangan
- **Petugas_Kesehatan**: Pengguna yang mengelola data kesehatan santri
- **Petugas_Asrama**: Pengguna yang mengelola data asrama dan kamar
- **Owner**: Pimpinan pesantren dengan akses laporan dan dashboard
- **Invoice**: Tagihan pembayaran dengan nomor unik per transaksi
- **QR_Token**: Token satu kali pakai yang digunakan untuk validasi presensi
- **Grace_Period**: Periode toleransi operasi offline setelah lisensi tidak dapat diverifikasi online
- **DLQ**: Dead Letter Queue — antrian untuk pesan WhatsApp yang gagal setelah maksimum retry
- **Hardware_Fingerprint**: Identifikasi unik perangkat server berdasarkan CPU, disk, motherboard, atau domain/IP
- **Audit_Log**: Catatan permanen setiap aksi kritikal yang dilakukan pengguna
- **Server_Timestamp**: Waktu dari server sebagai sumber kebenaran untuk transaksi kritikal

## Persyaratan

---

### Persyaratan 1: Autentikasi dan Manajemen Sesi

**User Story:** Sebagai pengguna sistem, saya ingin dapat login dengan aman dan sesi saya dikelola dengan baik, sehingga data pesantren terlindungi dari akses tidak sah.

#### Kriteria Penerimaan

1. WHEN pengguna mengirimkan kredensial yang valid ke endpoint login, THE Auth_Service SHALL mengembalikan access token JWT dan refresh token dalam waktu kurang dari 500ms pada persentil ke-95.
2. WHEN pengguna mengirimkan kredensial yang tidak valid, THE Auth_Service SHALL mengembalikan kode error 401 tanpa mengungkap informasi detail tentang akun.
3. WHEN access token JWT telah kedaluwarsa, THE Auth_Service SHALL menerima refresh token yang valid dan menerbitkan access token baru.
4. WHEN refresh token digunakan lebih dari satu kali, THE Auth_Service SHALL membatalkan seluruh sesi pengguna tersebut dan mengembalikan kode error 401.
5. WHEN pengguna melakukan logout, THE Auth_Service SHALL membatalkan refresh token yang aktif sehingga tidak dapat digunakan kembali.
6. WHEN endpoint login menerima lebih dari 10 percobaan gagal dalam 1 menit dari IP yang sama, THE Auth_Service SHALL menolak permintaan berikutnya selama 15 menit.
7. THE Auth_Service SHALL menyimpan password menggunakan algoritma bcrypt atau argon2 dengan salt yang unik per pengguna.
8. THE Audit_Logger SHALL mencatat setiap aksi login berhasil, login gagal, dan logout beserta timestamp server, IP address, dan identitas pengguna.

---

### Persyaratan 2: Role-Based Access Control (RBAC)

**User Story:** Sebagai Super Admin, saya ingin mengelola peran dan izin akses pengguna, sehingga setiap pengguna hanya dapat mengakses fitur yang sesuai dengan tanggung jawabnya.

#### Kriteria Penerimaan

1. THE RBAC_Engine SHALL mendukung minimal 9 peran: Super_Admin, Admin_Pesantren, Wali_Kelas, Petugas_Keuangan, Petugas_Kesehatan, Petugas_Asrama, Santri, Wali_Santri, dan Owner.
2. THE System SHALL memastikan satu akun pengguna hanya memiliki satu peran utama aktif pada satu waktu.
3. WHEN pengguna mengakses endpoint yang dilindungi, THE RBAC_Engine SHALL memverifikasi permission yang dimiliki pengguna sebelum memproses permintaan.
4. IF pengguna tidak memiliki permission yang diperlukan, THEN THE RBAC_Engine SHALL mengembalikan kode error 403 tanpa mengeksekusi logika bisnis endpoint tersebut.
5. THE RBAC_Engine SHALL mendukung 19 modul dengan matriks akses baca (R), tulis (W), dan tanpa akses (-) per kombinasi peran dan modul.
6. WHEN Super_Admin mengubah permission suatu peran, THE RBAC_Engine SHALL menerapkan perubahan tersebut pada semua pengguna dengan peran tersebut tanpa memerlukan re-login.
7. WHEN Wali_Santri mengakses data santri, THE RBAC_Engine SHALL membatasi akses hanya pada data santri yang terdaftar sebagai tanggungan Wali_Santri tersebut.
8. THE Audit_Logger SHALL mencatat setiap perubahan pada konfigurasi role dan permission beserta identitas pengguna yang melakukan perubahan.

---

### Persyaratan 3: Manajemen Data Santri dan Wali Santri

**User Story:** Sebagai Admin_Pesantren, saya ingin mengelola data santri dan wali santri secara lengkap, sehingga informasi peserta didik selalu akurat dan dapat diakses oleh pihak yang berwenang.

#### Kriteria Penerimaan

1. THE Santri_Service SHALL menyimpan data santri mencakup: identitas pribadi, data orang tua/wali, riwayat pendidikan, status aktif, dan foto.
2. WHEN Admin_Pesantren membuat data santri baru, THE Santri_Service SHALL memvalidasi bahwa nomor induk santri bersifat unik dalam sistem.
3. WHEN Admin_Pesantren menghapus data santri, THE Santri_Service SHALL melakukan soft delete sehingga data historis tetap tersimpan dan dapat diaudit.
4. THE Santri_Service SHALL mendukung relasi satu Wali_Santri dengan banyak santri (one-to-many).
5. WHEN data santri diperbarui, THE Audit_Logger SHALL mencatat perubahan beserta nilai sebelum dan sesudah perubahan, timestamp server, dan identitas pengguna.
6. THE Santri_Service SHALL menyediakan fitur pencarian santri berdasarkan nama, nomor induk, kelas, dan status aktif.
7. WHEN santri berpindah kamar asrama, THE Asrama_Service SHALL mencatat riwayat perpindahan dengan timestamp server tanpa menghapus data penempatan sebelumnya.

---

### Persyaratan 4: Penerimaan Peserta Didik Baru (PPDB)

**User Story:** Sebagai Admin_Pesantren, saya ingin mengelola proses penerimaan santri baru secara digital, sehingga proses pendaftaran lebih efisien dan terdata dengan baik.

#### Kriteria Penerimaan

1. THE PPDB_Service SHALL menyediakan formulir pendaftaran online yang dapat diisi oleh calon santri atau wali.
2. WHEN calon santri mengirimkan formulir pendaftaran, THE PPDB_Service SHALL menghasilkan nomor pendaftaran unik dan mengirimkan konfirmasi.
3. THE PPDB_Service SHALL mendukung alur seleksi dengan status: DRAFT, SUBMITTED, REVIEW, ACCEPTED, REJECTED.
4. WHEN status pendaftaran berubah, THE WA_Engine SHALL mengirimkan notifikasi WhatsApp kepada nomor wali santri yang terdaftar.
5. WHEN calon santri diterima, THE PPDB_Service SHALL memfasilitasi konversi data pendaftaran menjadi data santri aktif tanpa input ulang.

---

### Persyaratan 5: Presensi dengan QR Code dan GPS

**User Story:** Sebagai Petugas_Asrama atau Wali_Kelas, saya ingin mencatat kehadiran santri menggunakan QR code dan validasi GPS, sehingga presensi akurat dan tidak dapat dipalsukan.

#### Kriteria Penerimaan

1. WHEN petugas memulai sesi presensi, THE Presensi_Service SHALL menghasilkan QR_Token baru yang unik dan hanya berlaku selama 5 menit berdasarkan Server_Timestamp.
2. WHEN santri melakukan scan QR, THE QR_Validator SHALL memverifikasi bahwa QR_Token belum kedaluwarsa dan belum pernah digunakan sebelumnya (idempotency).
3. IF QR_Token telah kedaluwarsa, THEN THE QR_Validator SHALL menolak permintaan presensi dan mengembalikan kode error beserta pesan yang menjelaskan token telah kedaluwarsa.
4. WHEN santri melakukan presensi, THE GPS_Validator SHALL memverifikasi bahwa koordinat GPS santri berada dalam radius yang dikonfigurasi dari lokasi pesantren.
5. IF akurasi GPS lebih besar dari 50 meter, THEN THE GPS_Validator SHALL menandai presensi sebagai PENDING_REVIEW dan tidak langsung menolak.
6. IF koordinat GPS berada di luar radius yang dikonfigurasi, THEN THE GPS_Validator SHALL menolak presensi dan mencatat percobaan tersebut ke Audit_Logger.
7. THE Presensi_Service SHALL menggunakan Server_Timestamp sebagai waktu resmi presensi, bukan timestamp dari perangkat santri.
8. WHEN santri mencoba melakukan presensi lebih dari satu kali untuk sesi yang sama, THE Presensi_Service SHALL mengembalikan data presensi yang sudah ada tanpa membuat entri duplikat.
9. THE Presensi_Service SHALL memproses permintaan presensi dalam waktu kurang dari 700ms pada persentil ke-95.
10. WHERE fitur face recognition diaktifkan, THE Presensi_Service SHALL memvalidasi identitas santri melalui pencocokan wajah sebelum mencatat presensi.
11. THE Audit_Logger SHALL mencatat setiap percobaan presensi beserta status validasi, koordinat GPS, dan identitas santri.

---

### Persyaratan 6: Manajemen Akademik

**User Story:** Sebagai Wali_Kelas, saya ingin mengelola data kelas, mata pelajaran, jadwal, dan nilai santri, sehingga proses belajar mengajar terdokumentasi dengan baik.

#### Kriteria Penerimaan

1. THE Akademik_Service SHALL mendukung pengelolaan kelas, mata pelajaran, jadwal pelajaran, dan penilaian santri.
2. WHEN Wali_Kelas memasukkan nilai santri, THE Akademik_Service SHALL memvalidasi bahwa nilai berada dalam rentang yang dikonfigurasi (misalnya 0–100).
3. THE Akademik_Service SHALL menghasilkan rekap nilai per santri per periode yang dapat diekspor ke format PDF dan Excel.
4. WHEN jadwal pelajaran diperbarui, THE Akademik_Service SHALL memvalidasi tidak ada konflik jadwal untuk kelas dan pengajar yang sama.

---

### Persyaratan 7: Buku Penghubung Digital

**User Story:** Sebagai Wali_Kelas, saya ingin berkomunikasi dengan Wali_Santri melalui buku penghubung digital, sehingga informasi perkembangan santri dapat disampaikan secara efisien.

#### Kriteria Penerimaan

1. THE System SHALL menyediakan fitur buku penghubung digital antara Wali_Kelas dan Wali_Santri.
2. WHEN Wali_Kelas membuat catatan buku penghubung, THE WA_Engine SHALL mengirimkan notifikasi WhatsApp kepada Wali_Santri yang bersangkutan.
3. WHEN Wali_Santri membalas catatan buku penghubung, THE System SHALL menyimpan balasan dan menampilkannya kepada Wali_Kelas.
4. THE System SHALL menyimpan riwayat seluruh komunikasi buku penghubung dan tidak menghapus data historis.

---

### Persyaratan 8: Manajemen Pelanggaran dan Poin Reward

**User Story:** Sebagai Admin_Pesantren atau Wali_Kelas, saya ingin mencatat pelanggaran dan memberikan poin reward kepada santri, sehingga pembinaan karakter santri dapat dipantau secara objektif.

#### Kriteria Penerimaan

1. WHEN petugas mencatat pelanggaran santri, THE Pelanggaran_Service SHALL menyimpan data pelanggaran beserta kategori, tingkat keparahan, dan timestamp server.
2. THE Pelanggaran_Service SHALL menghitung akumulasi poin pelanggaran per santri dan memicu tindakan otomatis ketika ambang batas yang dikonfigurasi tercapai.
3. WHEN pelanggaran dicatat, THE WA_Engine SHALL mengirimkan notifikasi WhatsApp kepada Wali_Santri yang bersangkutan.
4. THE System SHALL mendukung pencatatan poin reward untuk santri yang berprestasi atau menunjukkan perilaku positif.
5. WHEN poin reward diberikan, THE WA_Engine SHALL mengirimkan notifikasi WhatsApp kepada Wali_Santri yang bersangkutan.
6. THE Audit_Logger SHALL mencatat setiap pencatatan pelanggaran dan pemberian reward beserta identitas petugas yang mencatat.

---

### Persyaratan 9: Manajemen Kesehatan Santri

**User Story:** Sebagai Petugas_Kesehatan, saya ingin mencatat rekam medis dan kunjungan kesehatan santri, sehingga kondisi kesehatan santri terpantau dan dapat ditangani dengan cepat.

#### Kriteria Penerimaan

1. THE Kesehatan_Service SHALL menyimpan rekam medis santri mencakup: riwayat penyakit, alergi, catatan kunjungan, dan tindakan medis.
2. WHEN Petugas_Kesehatan mencatat kunjungan santri ke klinik, THE Kesehatan_Service SHALL menyimpan data kunjungan beserta keluhan, diagnosis, dan tindakan.
3. WHEN santri memiliki kondisi kesehatan yang memerlukan perhatian khusus, THE WA_Engine SHALL mengirimkan notifikasi WhatsApp kepada Wali_Santri.
4. THE Kesehatan_Service SHALL membatasi akses rekam medis hanya kepada Petugas_Kesehatan, Admin_Pesantren, dan Super_Admin.
5. THE Kesehatan_Service SHALL menghasilkan laporan rekap kesehatan santri per periode yang dapat diekspor ke format PDF.

---

### Persyaratan 10: Manajemen Kunjungan Santri

**User Story:** Sebagai Petugas_Asrama, saya ingin mencatat dan mengelola kunjungan tamu kepada santri, sehingga keamanan dan ketertiban pesantren terjaga.

#### Kriteria Penerimaan

1. THE System SHALL menyediakan fitur pencatatan kunjungan tamu kepada santri dengan data: identitas tamu, hubungan dengan santri, waktu masuk, dan waktu keluar.
2. WHEN kunjungan dicatat, THE WA_Engine SHALL mengirimkan notifikasi WhatsApp kepada Wali_Santri yang terdaftar.
3. THE System SHALL menghasilkan laporan rekap kunjungan per periode dan per santri.

---

### Persyaratan 11: Manajemen Keuangan dan Pembayaran SPP

**User Story:** Sebagai Petugas_Keuangan, saya ingin mengelola tagihan dan pembayaran SPP santri, sehingga keuangan pesantren tercatat dengan akurat dan transparan.

#### Kriteria Penerimaan

1. WHEN Petugas_Keuangan membuat tagihan SPP, THE Pembayaran_Service SHALL menghasilkan Invoice dengan nomor unik yang tidak dapat diduplikasi.
2. THE Pembayaran_Service SHALL mendukung siklus hidup pembayaran dengan status: PENDING, PAID, EXPIRED, CANCELLED, dan REFUNDED.
3. WHEN pembayaran dikonfirmasi, THE Pembayaran_Service SHALL memperbarui status Invoice menjadi PAID dan mencatat timestamp server sebagai waktu pembayaran resmi.
4. IF dua permintaan konfirmasi pembayaran untuk Invoice yang sama diterima secara bersamaan, THEN THE Pembayaran_Service SHALL memproses hanya satu permintaan dan mengembalikan kode error 409 untuk permintaan kedua (race condition handling).
5. WHEN pembayaran berhasil dikonfirmasi, THE WA_Engine SHALL mengirimkan notifikasi WhatsApp berisi bukti pembayaran kepada Wali_Santri.
6. THE Audit_Logger SHALL mencatat setiap transaksi pembayaran beserta status sebelum dan sesudah, identitas petugas, dan timestamp server.
7. THE Pembayaran_Service SHALL menghasilkan laporan keuangan per periode yang dapat diekspor ke format PDF dan Excel.
8. WHILE Invoice berstatus PENDING, THE Pembayaran_Service SHALL menampilkan sisa waktu jatuh tempo kepada Petugas_Keuangan.

---

### Persyaratan 12: Top-Up Saldo Santri

**User Story:** Sebagai Wali_Santri, saya ingin melakukan top-up saldo untuk santri, sehingga santri dapat bertransaksi di koperasi pesantren tanpa membawa uang tunai.

#### Kriteria Penerimaan

1. THE Pembayaran_Service SHALL mendukung fitur top-up saldo elektronik untuk akun santri.
2. WHEN top-up saldo berhasil diproses, THE Pembayaran_Service SHALL memperbarui saldo santri secara atomik untuk mencegah race condition.
3. WHEN top-up saldo berhasil, THE WA_Engine SHALL mengirimkan notifikasi WhatsApp berisi konfirmasi top-up dan saldo terkini kepada Wali_Santri.
4. THE Pembayaran_Service SHALL menyimpan riwayat seluruh transaksi top-up dan tidak menghapus data historis.

---

### Persyaratan 13: Manajemen Koperasi Pesantren

**User Story:** Sebagai petugas koperasi, saya ingin mengelola inventaris dan transaksi koperasi, sehingga operasional koperasi pesantren berjalan efisien dan tercatat.

#### Kriteria Penerimaan

1. THE Koperasi_Service SHALL mendukung pengelolaan item koperasi mencakup: nama, harga, stok, dan kategori.
2. WHEN santri melakukan transaksi pembelian di koperasi, THE Koperasi_Service SHALL mendebit saldo santri secara atomik dan memperbarui stok item.
3. IF saldo santri tidak mencukupi untuk transaksi, THEN THE Koperasi_Service SHALL menolak transaksi dan mengembalikan kode error beserta informasi saldo terkini.
4. IF stok item habis, THEN THE Koperasi_Service SHALL menolak transaksi dan menginformasikan bahwa item tidak tersedia.
5. THE Koperasi_Service SHALL menghasilkan laporan transaksi koperasi per periode yang dapat diekspor ke format PDF dan Excel.

---

### Persyaratan 14: Manajemen Perizinan Santri

**User Story:** Sebagai Santri atau Wali_Santri, saya ingin mengajukan izin keluar pesantren secara digital, sehingga proses perizinan lebih cepat dan terdokumentasi.

#### Kriteria Penerimaan

1. THE Perizinan_Service SHALL mendukung siklus hidup izin dengan status: DRAFT, SUBMITTED, APPROVED, REJECTED, COMPLETED, dan CANCELLED.
2. WHEN Santri atau Wali_Santri mengajukan izin, THE Perizinan_Service SHALL menyimpan data izin beserta alasan, tanggal mulai, dan tanggal selesai yang diajukan.
3. WHEN status izin berubah menjadi APPROVED atau REJECTED, THE WA_Engine SHALL mengirimkan notifikasi WhatsApp kepada Wali_Santri dan Santri yang bersangkutan.
4. WHEN izin disetujui dan santri telah kembali, THE Perizinan_Service SHALL memperbarui status menjadi COMPLETED beserta timestamp kepulangan.
5. THE Audit_Logger SHALL mencatat setiap perubahan status izin beserta identitas petugas yang melakukan perubahan dan timestamp server.
6. IF santri belum kembali setelah tanggal selesai izin yang disetujui, THEN THE Perizinan_Service SHALL menandai izin sebagai terlambat dan memicu notifikasi kepada Admin_Pesantren.

---

### Persyaratan 15: Manajemen Asrama dan Kamar

**User Story:** Sebagai Petugas_Asrama, saya ingin mengelola data asrama, kamar, dan penempatan santri, sehingga kapasitas dan kondisi asrama terpantau dengan baik.

#### Kriteria Penerimaan

1. THE Asrama_Service SHALL mendukung pengelolaan data asrama dan kamar mencakup: nama, kapasitas, lantai, dan status.
2. WHEN Petugas_Asrama menempatkan santri ke kamar, THE Asrama_Service SHALL memvalidasi bahwa kapasitas kamar belum terlampaui.
3. IF kapasitas kamar telah penuh, THEN THE Asrama_Service SHALL menolak penempatan dan menginformasikan kapasitas kamar tersebut.
4. WHEN santri berpindah kamar, THE Asrama_Service SHALL mencatat riwayat perpindahan dengan timestamp server tanpa menghapus data penempatan sebelumnya.
5. THE Asrama_Service SHALL menghasilkan laporan hunian asrama yang menampilkan kapasitas, jumlah penghuni, dan daftar santri per kamar.

---

### Persyaratan 16: Manajemen Kepegawaian

**User Story:** Sebagai Admin_Pesantren, saya ingin mengelola data pegawai dan ustadz, sehingga informasi sumber daya manusia pesantren terkelola dengan baik.

#### Kriteria Penerimaan

1. THE Kepegawaian_Service SHALL menyimpan data pegawai mencakup: identitas pribadi, jabatan, tanggal bergabung, status aktif, dan dokumen terkait.
2. WHEN Admin_Pesantren menonaktifkan akun pegawai, THE System SHALL menonaktifkan akses login pegawai tersebut secara bersamaan.
3. THE Kepegawaian_Service SHALL mendukung pencatatan presensi pegawai yang terpisah dari presensi santri.
4. THE Kepegawaian_Service SHALL menghasilkan laporan kepegawaian per periode yang dapat diekspor ke format PDF dan Excel.

---

### Persyaratan 17: E-ID Card Digital

**User Story:** Sebagai Admin_Pesantren, saya ingin menghasilkan kartu identitas digital untuk santri, sehingga santri memiliki identitas resmi yang dapat diverifikasi secara digital.

#### Kriteria Penerimaan

1. THE EID_Service SHALL menghasilkan E-ID Card digital untuk setiap santri aktif yang memuat: foto, nama, nomor induk, kelas, dan QR code verifikasi.
2. WHEN E-ID Card dicetak atau diunduh, THE EID_Service SHALL menghasilkan file dalam format PDF dengan resolusi yang memadai untuk dicetak.
3. THE EID_Service SHALL menyematkan QR code pada E-ID Card yang dapat dipindai untuk memverifikasi keaslian identitas santri.
4. WHEN data santri diperbarui (foto, kelas, atau status), THE EID_Service SHALL memungkinkan regenerasi E-ID Card dengan data terbaru.

---

### Persyaratan 18: WhatsApp Notification Engine

**User Story:** Sebagai Admin_Pesantren, saya ingin sistem mengirimkan notifikasi WhatsApp otomatis untuk berbagai kejadian penting, sehingga Wali_Santri selalu mendapatkan informasi terkini.

#### Kriteria Penerimaan

1. THE WA_Engine SHALL memproses pengiriman notifikasi WhatsApp secara asinkron melalui antrian (queue table) untuk mencegah blocking pada operasi utama.
2. WHEN WA_Worker gagal mengirimkan pesan, THE WA_Engine SHALL menjadwalkan ulang pengiriman dengan kebijakan exponential backoff: percobaan ke-1 setelah 1 menit, ke-2 setelah 2 menit, ke-3 setelah 4 menit, ke-4 setelah 8 menit, ke-5 setelah 16 menit, dengan jitter 10%.
3. IF pesan gagal setelah 5 kali percobaan, THEN THE WA_Engine SHALL memindahkan pesan ke DLQ dan menandai status sebagai DLQ.
4. THE WA_Engine SHALL mendukung status pesan: PENDING, RETRYING, SENT, FAILED, dan DLQ.
5. THE Template_Engine SHALL merender pesan WhatsApp dari template yang dikonfigurasi dengan variabel dinamis per jenis notifikasi.
6. THE Provider_Adapter SHALL mendukung konfigurasi gateway WhatsApp eksternal yang dapat diganti tanpa mengubah logika bisnis WA_Engine.
7. WHEN provider WhatsApp tidak dapat dijangkau, THE WA_Engine SHALL mencatat kegagalan dan menjadwalkan ulang sesuai kebijakan retry tanpa mengganggu operasi sistem lainnya.
8. THE WA_Engine SHALL mendukung minimal jenis notifikasi: presensi masuk/keluar, pembayaran, pelanggaran, reward, izin, kunjungan, dan buku penghubung.
9. THE Audit_Logger SHALL mencatat setiap upaya pengiriman WhatsApp beserta status, nomor tujuan (disamarkan), dan timestamp server.

---

### Persyaratan 19: Sistem Lisensi Perpetual

**User Story:** Sebagai Owner pesantren, saya ingin sistem dapat diaktifkan dengan lisensi perpetual dan tetap berfungsi meskipun koneksi internet tidak stabil, sehingga operasional pesantren tidak terganggu.

#### Kriteria Penerimaan

1. WHEN sistem pertama kali diinstal, THE License_Service SHALL memerlukan aktivasi online dengan kode lisensi yang valid.
2. WHEN aktivasi online berhasil, THE License_Service SHALL menyimpan bukti aktivasi secara lokal untuk keperluan verifikasi offline.
3. WHILE koneksi internet tidak tersedia, THE License_Service SHALL mengizinkan operasi sistem selama Grace_Period yang dikonfigurasi (default: 30 hari) berdasarkan verifikasi lokal.
4. IF Grace_Period telah habis dan sistem belum dapat melakukan verifikasi online, THEN THE License_Service SHALL membatasi akses hanya pada fitur baca (read-only) dan menampilkan peringatan kepada Super_Admin.
5. WHERE fitur Hardware_Fingerprint diaktifkan, THE License_Service SHALL mengikat lisensi pada identifikasi unik perangkat server (CPU, disk, motherboard, atau domain/IP) dan menolak aktivasi pada perangkat yang berbeda.
6. WHEN lisensi diverifikasi, THE License_Service SHALL mencatat aktivitas verifikasi ke Audit_Logger beserta timestamp server dan status verifikasi.
7. THE License_Service SHALL menyediakan endpoint untuk verifikasi status lisensi yang dapat diakses oleh Super_Admin.

---

### Persyaratan 20: Audit Log Terpusat

**User Story:** Sebagai Super_Admin atau Owner, saya ingin semua aksi kritikal tercatat dalam audit log, sehingga setiap perubahan data dapat ditelusuri dan dipertanggungjawabkan.

#### Kriteria Penerimaan

1. THE Audit_Logger SHALL mencatat setiap aksi kritikal mencakup: autentikasi, perubahan data santri, transaksi keuangan, perubahan RBAC, presensi, perizinan, dan perubahan lisensi.
2. THE Audit_Logger SHALL menyimpan setiap entri audit log dengan data: identitas pengguna, jenis aksi, entitas yang dipengaruhi, nilai sebelum dan sesudah perubahan, timestamp server, dan IP address.
3. THE System SHALL memastikan entri audit log bersifat immutable — tidak dapat diubah atau dihapus oleh pengguna manapun termasuk Super_Admin.
4. THE Audit_Logger SHALL menggunakan Server_Timestamp untuk semua entri audit log.
5. WHEN Super_Admin atau Owner mengakses audit log, THE System SHALL menyediakan fitur filter berdasarkan jenis aksi, rentang waktu, dan identitas pengguna.

---

### Persyaratan 21: Dashboard dan Laporan

**User Story:** Sebagai Owner atau Admin_Pesantren, saya ingin melihat ringkasan data operasional dan menghasilkan laporan, sehingga pengambilan keputusan dapat dilakukan berdasarkan data yang akurat.

#### Kriteria Penerimaan

1. THE Dashboard_Service SHALL menampilkan ringkasan data operasional mencakup: jumlah santri aktif, rekap presensi hari ini, tagihan jatuh tempo, dan notifikasi terbaru.
2. THE Dashboard_Service SHALL memuat data dashboard dalam waktu kurang dari 2 detik pada persentil ke-95.
3. THE Laporan_Service SHALL mendukung ekspor laporan ke format PDF dan Excel untuk semua modul yang relevan.
4. WHEN laporan berukuran besar diproses, THE Laporan_Service SHALL memproses laporan secara asinkron dan mengirimkan notifikasi kepada pengguna ketika laporan siap diunduh.
5. THE Laporan_Service SHALL mendukung filter laporan berdasarkan rentang tanggal, kelas, asrama, dan parameter relevan lainnya per jenis laporan.

---

### Persyaratan 22: Keamanan dan Non-Fungsional

**User Story:** Sebagai Owner pesantren, saya ingin sistem memenuhi standar keamanan dan performa enterprise, sehingga data pesantren terlindungi dan sistem dapat diandalkan.

#### Kriteria Penerimaan

1. THE System SHALL menggunakan HTTPS untuk semua komunikasi antara klien dan server.
2. THE System SHALL menerapkan mekanisme anti-replay pada endpoint presensi dan pembayaran menggunakan nonce atau idempotency key.
3. THE System SHALL berfungsi untuk operasi inti (presensi, pembayaran, perizinan) tanpa koneksi internet eksternal, kecuali untuk fitur yang secara eksplisit memerlukan koneksi (WhatsApp, verifikasi lisensi online).
4. THE System SHALL mendukung deployment menggunakan Docker dengan komponen: frontend, API server, dan worker.
5. THE System SHALL berjalan pada spesifikasi minimal: 2 vCPU, 4GB RAM, 60GB SSD, PostgreSQL 14+, Redis 6+.
6. THE System SHALL melakukan backup database otomatis harian dengan retensi minimal 30 hari, RPO 24 jam, dan RTO 4 jam.
7. THE System SHALL menerapkan rate limiting pada semua endpoint publik untuk mencegah penyalahgunaan.
8. WHEN terjadi error pada sistem, THE System SHALL mencatat detail error ke log sistem tanpa mengekspos informasi sensitif kepada pengguna akhir.
