# 📱 Panduan Akses Scanner Mobile

## 🌐 Cara Akses Scanner Mobile

Ada **3 cara** untuk mengakses scanner mobile:

### 1. **URL Langsung** (Paling Cepat)
```
https://[domain]/scanner
```

**Contoh**:
- `https://pesantren.app/scanner`
- `https://localhost:5173/scanner`
- `https://192.168.1.100:5173/scanner` (Local network)

**Keuntungan**:
- ✅ Akses langsung tanpa perlu login
- ✅ Cepat dan mudah
- ✅ Bisa di-bookmark di HP

---

### 2. **Landing Page Scanner** (Recommended)
```
https://[domain]/scanner-info
```

**Fitur**:
- ✅ Informasi lengkap tentang scanner
- ✅ Quick access dengan PIN input
- ✅ Panduan cara menggunakan
- ✅ Tips dan troubleshooting
- ✅ Persyaratan sistem

**Akses**:
1. Buka `https://[domain]/scanner-info`
2. Lihat informasi scanner
3. Input PIN Scanner
4. Klik "Buka Scanner"

---

### 3. **Via Halaman Presensi** (Untuk Admin)
```
Dashboard → Presensi Digital QR Code → [Button "Scanner Mobile"]
```

**Langkah**:
1. Login ke dashboard
2. Buka menu "Presensi Digital QR Code"
3. Klik button "Scanner Mobile" (top-right)
4. Akan redirect ke `/scanner`

---

## 🔑 Cara Mendapatkan PIN Scanner

### Untuk Admin Pesantren:

1. **Login ke Dashboard**
   - Buka `https://[domain]/login`
   - Input email & password admin

2. **Buka Halaman Presensi**
   - Menu → Presensi Digital QR Code
   - Atau akses: `https://[domain]/dashboard/presensi`

3. **Generate PIN Scanner**
   - Klik tab "Pengaturan Scanner"
   - Klik button "Generate PIN Scanner"
   - PIN akan di-generate (6 digit)

4. **Share PIN ke Petugas**
   - Copy PIN yang sudah di-generate
   - Share ke petugas absensi via WhatsApp/SMS
   - Atau cetak dan tempel di ruang absensi

### Untuk Petugas Absensi:

1. **Terima PIN dari Admin**
   - Admin akan memberikan PIN Scanner

2. **Akses Scanner Mobile**
   - Buka `/scanner` atau `/scanner-info`
   - Input PIN yang diterima
   - Klik "Mulai Scanner"

---

## 📊 Akses dari Berbagai Perangkat

### Desktop/Laptop
```
https://pesantren.app/scanner
```
- Buka di browser
- Izinkan akses kamera & GPS
- Siap scanning

### Smartphone (Recommended)
```
https://pesantren.app/scanner
```
- Buka di browser HP
- Izinkan akses kamera & GPS
- Optimal untuk scanning

### Tablet
```
https://pesantren.app/scanner
```
- Buka di browser tablet
- Izinkan akses kamera & GPS
- Cocok untuk scanning area luas

---

## 🔗 URL Reference

| Halaman | URL | Akses |
|---------|-----|-------|
| Scanner Mobile | `/scanner` | Public (perlu PIN) |
| Landing Scanner | `/scanner-info` | Public |
| Presensi Admin | `/dashboard/presensi` | Private (perlu login) |
| Landing Utama | `/` | Public |

---

## 🚀 Quick Start Guide

### Untuk Admin:

```
1. Login ke dashboard
   ↓
2. Buka Presensi → Pengaturan Scanner
   ↓
3. Generate PIN Scanner
   ↓
4. Share PIN ke petugas
   ↓
5. Petugas akses /scanner dengan PIN
```

### Untuk Petugas:

```
1. Terima PIN dari admin
   ↓
2. Buka https://[domain]/scanner
   ↓
3. Input PIN Scanner
   ↓
4. Klik "Mulai Scanner"
   ↓
5. Arahkan kamera ke QR code
   ↓
6. Presensi tercatat otomatis
```

---

## 📱 Bookmark Scanner di HP

### Android Chrome:
1. Buka `/scanner` di Chrome
2. Tap menu (⋮) → "Add to Home screen"
3. Beri nama "Scanner Absensi"
4. Tap "Add"
5. Icon akan muncul di home screen

### iOS Safari:
1. Buka `/scanner` di Safari
2. Tap share button (↗)
3. Tap "Add to Home Screen"
4. Beri nama "Scanner Absensi"
5. Tap "Add"
6. Icon akan muncul di home screen

---

## 🔐 Security Notes

- ✅ PIN Scanner hanya untuk autentikasi
- ✅ Setiap scan tercatat dengan GPS & timestamp
- ✅ Tidak ada data sensitif di QR code
- ✅ Backend validasi setiap scan
- ✅ Audit log untuk semua aktivitas

---

## 🐛 Troubleshooting

### Scanner tidak bisa diakses
- Pastikan URL benar
- Cek koneksi internet
- Coba refresh halaman
- Coba browser lain

### PIN tidak valid
- Pastikan PIN benar (6 digit)
- Cek di halaman Presensi → Pengaturan Scanner
- Minta admin untuk generate PIN baru

### Kamera tidak bisa diakses
- Izinkan akses kamera di browser
- Cek setting HP untuk permission
- Coba browser lain
- Restart HP

### GPS tidak bisa diakses
- Izinkan akses lokasi di browser
- Cek setting HP untuk location services
- Pindah ke area terbuka
- Coba ulang scanning

---

## 📋 Checklist Sebelum Scanning

- ✅ Koneksi internet stabil
- ✅ Kamera HP berfungsi baik
- ✅ GPS aktif (untuk geotagging)
- ✅ PIN Scanner sudah diterima
- ✅ E-ID Card santri siap
- ✅ Pencahayaan cukup
- ✅ Browser permission sudah diizinkan

---

## 💡 Tips Optimal

1. **Gunakan di Area Terbuka**
   - GPS lebih akurat
   - Pencahayaan lebih baik

2. **Pastikan QR Code Jelas**
   - Tidak rusak atau tergores
   - Tidak tertutup atau terlipat

3. **Jarak Scanning**
   - 10-20 cm dari QR code
   - Arahkan kamera tegak lurus

4. **Waktu Scanning**
   - Scan saat santri datang
   - Scan saat santri pulang (jika diperlukan)

5. **Backup PIN**
   - Catat PIN di tempat aman
   - Jangan share ke orang lain

---

## 📞 Support

Jika ada masalah:
1. Cek troubleshooting di atas
2. Hubungi admin pesantren
3. Cek browser console untuk error detail
4. Restart HP dan coba ulang

---

**Status**: ✅ SELESAI
**Tanggal**: 2026-04-08
**Files Created**:
- `frontend/src/pages/public/ScannerLandingPage.tsx`

**Files Modified**:
- `frontend/src/App.tsx`
- `frontend/src/pages/public/LandingPage.tsx`

