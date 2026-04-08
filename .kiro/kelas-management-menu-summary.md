# Penambahan Menu Manajemen Kelas ke Frontend

## Masalah
Fitur manajemen kelas sudah ada di backend dan frontend (`ManajemenKelasPage.tsx`), tetapi tidak muncul di menu sidebar. Route juga sudah dikonfigurasi di `App.tsx` tetapi tidak accessible dari UI.

## Solusi yang Diterapkan

### 1. **Update Sidebar Navigation Structure** ✅
File: `frontend/src/components/layout/Sidebar.tsx`

#### Perubahan:
- Tambah import `useLocation` dari react-router-dom
- Tambah import `BookOpen` icon dari lucide-react
- Ubah struktur `navItems` dari array sederhana menjadi array dengan support submenu
- Tambah interface `NavItem` untuk type safety

#### Struktur Baru:
```typescript
interface NavItem {
  path: string;
  icon: any;
  label: string;
  submenu?: { path: string; label: string }[];
}
```

### 2. **Implementasi Submenu untuk Akademik** ✅
```typescript
{ 
  path: '/dashboard/akademik', 
  icon: GraduationCap, 
  label: 'Akademik',
  submenu: [
    { path: '/dashboard/akademik', label: 'Tahfidz & Penilaian' },
    { path: '/dashboard/akademik/kelas', label: 'Manajemen Kelas' },
  ]
}
```

### 3. **Tambah State untuk Menu Expansion** ✅
```typescript
const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
```

### 4. **Auto-Expand Menu Saat Submenu Aktif** ✅
```typescript
useEffect(() => {
  const activeItem = navItems.find(item => 
    item.submenu?.some(sub => location.pathname.startsWith(sub.path))
  );
  if (activeItem) {
    setExpandedMenu(activeItem.path);
  }
}, [location.pathname]);
```

### 5. **Render Submenu dengan Conditional Logic** ✅
- Jika item memiliki submenu: render button dengan chevron icon yang bisa di-expand/collapse
- Jika submenu expanded: tampilkan list submenu items dengan styling yang berbeda
- Jika item tidak memiliki submenu: render NavLink biasa

#### Styling Submenu:
- Border kiri dengan warna primary/30
- Padding kiri untuk indentasi
- Dot indicator untuk setiap submenu item
- Highlight warna primary/20 saat submenu aktif

### 6. **Tambah Fitur View Santri dalam Kelas** ✅ (NEW)
File: `frontend/src/pages/akademik/ManajemenKelasPage.tsx`

#### Backend Changes:
- **File**: `backend/src/modules/academic/academic.service.ts`
  - Tambah method `getSantriByKelas(tenantId, kelasId)` untuk fetch santri berdasarkan kelas
  - Return data: kelas info + daftar santri + total count
  
- **File**: `backend/src/modules/academic/academic.controller.ts`
  - Tambah endpoint `GET /academic/kelas/:id` untuk fetch santri by kelas ID
  - Guard: JWT + RolesGuard (accessible untuk SUPERADMIN, TENANT_ADMIN, PENGURUS, GURU, WALI, SANTRI)

#### Frontend Changes:
- Tambah interface `Santri` dan `KelasDetail` untuk type safety
- Tambah state: `showSantriModal`, `selectedKelas`, `kelasDetail`, `loadingSantri`
- Tambah handler: `handleOpenSantriModal()` untuk fetch dan display santri
- Tambah button "Lihat Santri" (Eye icon) di setiap kelas card
- Tambah modal untuk menampilkan daftar santri dengan:
  - Foto santri (avatar fallback jika tidak ada)
  - Nama lengkap
  - NIS dan NISN
  - Jenis kelamin
  - Status santri
  - Scrollable list untuk banyak santri
  - Loading state saat fetch data

## Hasil Akhir

### Menu Akademik Sebelum:
```
📚 Akademik
```

### Menu Akademik Sesudah:
```
📚 Akademik ▼
  • Tahfidz & Penilaian
  • Manajemen Kelas
```

### Kelas Card Sebelum:
```
[Edit] [Delete]
Kelas 7A
Kapasitas: 30
```

### Kelas Card Sesudah:
```
[View] [Edit] [Delete]
Kelas 7A
Kapasitas: 30
```

## Fitur yang Ditambahkan

1. **Expandable Menu** - Klik menu Akademik untuk expand/collapse submenu
2. **Auto-Expand** - Menu otomatis expand saat user navigasi ke submenu
3. **Visual Indicator** - Chevron icon menunjukkan state expanded/collapsed
4. **Active State** - Submenu item highlight saat aktif
5. **Responsive** - Submenu items tetap readable di semua ukuran layar
6. **View Santri Modal** - Klik eye icon untuk melihat daftar santri dalam kelas
7. **Santri Details** - Tampilkan foto, nama, NIS, NISN, jenis kelamin, status
8. **Loading State** - Indikator loading saat fetch data santri

## Routes yang Sudah Tersedia

| Route | Component | Deskripsi |
|-------|-----------|-----------|
| `/dashboard/akademik` | `AkademikPage` | Tahfidz & Penilaian (halaman utama) |
| `/dashboard/akademik/kelas` | `ManajemenKelasPage` | Manajemen Kelas |

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/academic/kelas` | Daftar semua kelas |
| GET | `/academic/kelas/:id` | Fetch santri by kelas ID (NEW) |
| POST | `/academic/kelas` | Buat kelas baru |
| PUT | `/academic/kelas/:id` | Update kelas |
| DELETE | `/academic/kelas/:id` | Nonaktifkan kelas |

## Testing Checklist

- [x] Sidebar.tsx tidak ada compilation error
- [x] Menu Akademik bisa di-expand/collapse
- [x] Submenu items muncul saat expanded
- [x] Navigasi ke `/dashboard/akademik/kelas` berfungsi
- [x] Menu auto-expand saat user di halaman Manajemen Kelas
- [x] Styling submenu sesuai dengan design system
- [x] Backend endpoint `/academic/kelas/:id` berfungsi
- [x] Frontend modal santri muncul saat klik eye icon
- [x] Daftar santri ditampilkan dengan benar
- [x] Loading state berfungsi
- [x] Error handling berfungsi

## Struktur File yang Dimodifikasi

```
backend/src/
├── modules/
│   └── academic/
│       ├── academic.service.ts (MODIFIED - tambah getSantriByKelas)
│       └── academic.controller.ts (MODIFIED - tambah GET /kelas/:id endpoint)

frontend/src/
├── components/
│   └── layout/
│       └── Sidebar.tsx (MODIFIED - submenu structure)
├── pages/
│   └── akademik/
│       ├── ManajemenKelasPage.tsx (ENHANCED - tambah view santri modal)
│       ├── AkademikPage.tsx (existing)
│       └── TahfidzFormModal.tsx (existing)
└── App.tsx (existing - route sudah ada)
```

## Cara Menggunakan

### Akses Menu Akademik:
1. Klik menu "Akademik" di sidebar
2. Menu akan expand menampilkan submenu

### Akses Manajemen Kelas:
1. Klik "Manajemen Kelas" di submenu
2. Atau navigasi langsung ke `/dashboard/akademik/kelas`

### Lihat Santri dalam Kelas:
1. Di halaman Manajemen Kelas, klik eye icon pada kelas card
2. Modal akan terbuka menampilkan daftar santri
3. Lihat detail santri: foto, nama, NIS, NISN, jenis kelamin, status
4. Klik "Tutup" untuk menutup modal

### Kembali ke Tahfidz:
1. Klik "Tahfidz & Penilaian" di submenu
2. Atau navigasi ke `/dashboard/akademik`

## Future Enhancements

Struktur submenu ini dapat digunakan untuk menambahkan submenu ke menu lain:
- Keuangan (Pembayaran SPP, Top-Up Saldo, Laporan Keuangan)
- Asrama (Penempatan, Maintenance, Laporan Hunian)
- Kepegawaian (Data Pegawai, Presensi Pegawai, Payroll)
- dll.

Cukup tambahkan `submenu` property ke item di `navItems` array.

Fitur tambahan yang bisa ditambahkan ke view santri:
- Tambah santri ke kelas
- Pindahkan santri ke kelas lain
- Edit data santri dari modal
- Filter santri berdasarkan status/gender
- Export daftar santri ke Excel

