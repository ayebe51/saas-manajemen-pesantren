# ✨ Fitur: Barcode pada E-ID Card untuk Absensi

## 📋 Deskripsi
Mengintegrasikan barcode pada e-idcard santri untuk fungsi absensi. Barcode dapat di-scan menggunakan barcode scanner hardware untuk mencatat presensi dengan cepat dan akurat.

## 🎯 Fitur yang Ditambahkan

### 1. Barcode pada E-ID Card
**File**: `frontend/src/pages/id-card/IdCardGeneratorPage.tsx`

**Perubahan**:
- Tambah import `jsbarcode` library
- Tambah `useEffect` untuk generate barcode ketika selectedPerson berubah
- Tambah SVG element untuk render barcode di card
- Barcode berisi santriId (unique identifier)
- Barcode format: CODE128 (standar industri)

**Struktur Barcode**:
```
Barcode Value: [santriId]
Format: CODE128
Size: 70x30 pixels
```

**Tampilan di Card**:
```
┌─────────────────────────┐
│   APSS Pesantren        │
│   Kartu Identitas       │
│                         │
│   [Foto Santri]         │
│                         │
│   Nama Santri           │
│   NISN: 1234567890      │
│                         │
│   ┌─────────────────┐   │
│   │  [QR Code]      │   │
│   └─────────────────┘   │
│   ┌─────────────────┐   │
│   │ |||||||||||||||  │   │ ← Barcode
│   │ |||||||||||||||  │   │
│   └─────────────────┘   │
│                         │
│   © 2026 APSS           │
└─────────────────────────┘
```

### 2. Tab Scan Barcode di Presensi
**File**: `frontend/src/pages/presensi/PresensiPage.tsx`

**Perubahan**:
- Tambah tab baru "Scan Barcode" di halaman presensi
- Tambah input field untuk barcode scanner
- Tambah function `handleBarcodeSubmit()` untuk process barcode
- Tambah state untuk barcode scanning

**Tab Navigation**:
```
[QR Code Santri] [Scan Barcode] [Log Hari Ini] [Pengaturan Scanner]
```

**UI Barcode Scanner**:
- Input field dengan placeholder "Letakkan kursor di sini dan scan barcode..."
- Auto-focus pada input field
- Button "Proses Barcode" untuk manual submit
- Tips penggunaan
- Loading state saat processing

### 3. Backend Integration
**Endpoint**: `POST /attendance/scan`

**Data yang Dikirim**:
```json
{
  "qrToken": "barcode-[santriId]",
  "santriId": "[santriId]",
  "gpsLat": 0,
  "gpsLng": 0
}
```

**Response**:
```json
{
  "success": true,
  "message": "Presensi berhasil tercatat",
  "data": {
    "id": "...",
    "santriId": "...",
    "timestamp": "2026-04-08T10:30:00Z",
    "type": "HADIR"
  }
}
```

## 🔄 Data Flow

### Saat Cetak E-ID Card
```
1. User pilih santri di IdCardGeneratorPage
2. Component render card dengan:
   - QR Code (JSON: {id, type})
   - Barcode (santriId)
3. User cetak kartu
```

### Saat Scan Barcode untuk Absensi
```
1. User buka tab "Scan Barcode" di PresensiPage
2. User arahkan barcode scanner ke barcode di kartu
3. Barcode scanner input santriId ke input field
4. handleBarcodeSubmit() dipanggil
5. Verifikasi santri ada di list
6. POST /attendance/scan dengan santriId
7. Backend catat presensi
8. Toast success/error
9. Input field di-clear dan di-focus ulang
10. Log presensi di-refresh
```

## 📦 Dependencies

**Frontend**:
- `jsbarcode`: ^3.11.5 (untuk generate barcode)
- `react-qr-code`: ^2.0.18 (sudah ada, untuk QR code)

**Backend**:
- Tidak ada dependency baru (menggunakan endpoint yang sudah ada)

## 🛠️ Implementasi Detail

### E-ID Card Barcode Generation
```typescript
useEffect(() => {
  if (selectedPerson) {
    try {
      JsBarcode(`#barcode-${selectedPerson.id}`, selectedPerson.id, {
        format: 'CODE128',
        width: 2,
        height: 30,
        displayValue: false,
        margin: 0,
      });
    } catch (err) {
      console.error('Failed to generate barcode:', err);
    }
  }
}, [selectedPerson]);
```

### Barcode Scanner Input
```typescript
const handleBarcodeSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!barcodeInput.trim()) return;

  setBarcodeScanning(true);
  try {
    const santriId = barcodeInput.trim();
    
    // Verify santri exists
    const santri = santriList.find(s => s.id === santriId);
    if (!santri) {
      toast.error('Santri tidak ditemukan');
      return;
    }

    // Submit attendance
    await api.post('/attendance/scan', {
      qrToken: 'barcode-' + santriId,
      santriId: santriId,
      gpsLat: 0,
      gpsLng: 0,
    });

    toast.success(`Presensi ${santri.name} berhasil tercatat`);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
    fetchData();
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Gagal mencatat presensi');
  } finally {
    setBarcodeScanning(false);
  }
};
```

## ✅ Fitur

- ✅ Barcode di e-idcard dengan format CODE128
- ✅ Tab "Scan Barcode" di halaman presensi
- ✅ Input field untuk barcode scanner
- ✅ Verifikasi santri sebelum submit
- ✅ Error handling dan toast notifications
- ✅ Auto-focus input field setelah scan
- ✅ Refresh log presensi setelah scan
- ✅ Loading state saat processing
- ✅ Tips penggunaan untuk user

## 🚀 Cara Menggunakan

### 1. Cetak E-ID Card dengan Barcode
```
1. Buka halaman "ID Card Generator"
2. Pilih tab "Data Santri"
3. Cari dan pilih santri
4. Lihat preview card dengan barcode
5. Klik "Cetak Kartu"
6. Print kartu
```

### 2. Scan Barcode untuk Absensi
```
1. Buka halaman "Presensi Digital QR Code"
2. Klik tab "Scan Barcode"
3. Letakkan kursor di input field
4. Arahkan barcode scanner ke barcode di kartu
5. Barcode akan otomatis di-scan dan diproses
6. Lihat notifikasi success/error
7. Cek log presensi di tab "Log Hari Ini"
```

## 🔧 Konfigurasi Barcode Scanner

### Hardware Scanner
- Gunakan barcode scanner USB/Bluetooth standar
- Scanner akan input santriId ke input field
- Pastikan input field ter-focus sebelum scan

### Software Scanner (Alternatif)
- Bisa menggunakan aplikasi barcode scanner mobile
- Scan barcode dan copy-paste santriId ke input field
- Klik "Proses Barcode" untuk submit

## 📊 Barcode Format

**Barcode Type**: CODE128
- Format standar industri
- Dapat di-scan oleh semua barcode scanner
- Readable oleh aplikasi barcode scanner mobile

**Barcode Content**: santriId (UUID)
- Unique identifier untuk setiap santri
- Tidak ada informasi sensitif
- Dapat di-link ke database untuk verifikasi

## 🔐 Keamanan

- ✅ Barcode hanya berisi santriId (tidak ada data sensitif)
- ✅ Verifikasi santri di backend sebelum catat presensi
- ✅ Timestamp server digunakan (bukan client timestamp)
- ✅ Audit log untuk setiap presensi
- ✅ GPS validation (optional, bisa di-enable)

## 📝 Catatan

### Barcode vs QR Code
| Aspek | Barcode | QR Code |
|-------|---------|---------|
| Format | CODE128 | JSON |
| Capacity | Kecil (ID saja) | Besar (JSON object) |
| Scan Speed | Cepat | Cepat |
| Hardware | Barcode scanner | Kamera/QR scanner |
| Use Case | Absensi cepat | Informasi detail |

### Rekomendasi Penggunaan
- **Barcode**: Untuk absensi cepat dengan barcode scanner hardware
- **QR Code**: Untuk informasi detail atau scan dengan smartphone

## 🐛 Troubleshooting

### Barcode tidak muncul di card
- Pastikan jsbarcode sudah ter-install: `npm install jsbarcode`
- Cek console untuk error message
- Refresh halaman

### Barcode tidak ter-scan
- Pastikan input field ter-focus
- Cek barcode scanner setting (pastikan output ke keyboard)
- Coba scan barcode lain untuk verifikasi scanner

### Presensi tidak tercatat
- Cek error message di toast notification
- Verifikasi santri ada di database
- Cek backend logs untuk error detail

## 📋 Checklist

- ✅ Tambah jsbarcode ke dependencies
- ✅ Generate barcode di e-idcard
- ✅ Tambah tab "Scan Barcode" di presensi
- ✅ Implement barcode scanner input
- ✅ Handle barcode submit
- ✅ Verifikasi santri
- ✅ Submit attendance ke backend
- ✅ Error handling dan notifications
- ✅ Refresh log presensi
- ✅ Testing

---

**Status**: ✅ SELESAI
**Tanggal**: 2026-04-08
**Files Modified**:
- `frontend/src/pages/id-card/IdCardGeneratorPage.tsx`
- `frontend/src/pages/presensi/PresensiPage.tsx`
- `frontend/package.json`

