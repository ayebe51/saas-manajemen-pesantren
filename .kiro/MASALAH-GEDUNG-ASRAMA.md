# 🏢 Perbaikan: Gagal Tambah Gedung Asrama

## 🔍 Masalah yang Ditemukan

User melaporkan **gagal tambah gedung** meskipun DTO sudah diperbaiki. Setelah investigasi mendalam, ditemukan **masalah yang lebih fundamental**:

### Root Cause: Duplikasi Model di Prisma Schema

Ada **2 model yang berbeda** untuk asrama:

#### 1. Model `Building` (Lama - English)
```prisma
model Building {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  description String?
  gender      String
  capacity    Int      @default(0)
  rooms       Room[]
}
```

#### 2. Model `Asrama` (Baru - Indonesian)
```prisma
model Asrama {
  id          String   @id @default(uuid())
  tenantId    String
  nama        String
  deskripsi   String?
  kamar       Kamar[]
}
```

### Masalah:
- **Service menggunakan model `Building`** (lama)
- **Tapi Prisma schema sudah punya model `Asrama`** (baru, sesuai requirements)
- **DTO menggunakan nama English** (`CreateBuildingDto`)
- **Terjadi mismatch antara DTO, Service, dan Prisma Model**

## ✅ Solusi yang Diterapkan

### 1. Update Service untuk Menggunakan Model `Asrama`

**Sebelum:**
```typescript
async createBuilding(tenantId: string, dto: CreateBuildingDto) {
  return this.prisma.building.create({ data: { ...dto, tenantId } });
}
```

**Sesudah:**
```typescript
async createBuilding(tenantId: string, dto: CreateBuildingDto) {
  // Map English DTO to Indonesian model
  return this.prisma.asrama.create({
    data: {
      tenantId,
      nama: dto.name,
      deskripsi: dto.description,
    },
  });
}
```

### 2. Update Semua Method untuk Menggunakan Model Baru

| Method | Model Lama | Model Baru | Status |
|--------|-----------|-----------|--------|
| createBuilding | building | asrama | ✅ |
| findAllBuildings | building | asrama | ✅ |
| updateBuilding | building | asrama | ✅ |
| createRoom | room | kamar | ✅ |
| findAllRooms | room | kamar | ✅ |
| updateRoom | room | kamar | ✅ |
| assignRoom | roomAssignment | penempatanSantri | ✅ |
| checkoutRoom | roomAssignment | penempatanSantri | ✅ |

### 3. Mapping DTO English ke Model Indonesian

```typescript
// DTO (English) → Model (Indonesian)
dto.name → asrama.nama
dto.description → asrama.deskripsi
dto.buildingId → kamar.asramaId
dto.capacity → kamar.kapasitas
dto.startDate → penempatanSantri.tanggalMasuk
dto.endDate → penempatanSantri.tanggalKeluar
```

## 📊 Perubahan yang Dilakukan

### File: `backend/src/modules/dormitory/dormitory.service.ts`

**Perubahan:**
- ✅ Ganti `prisma.building` → `prisma.asrama`
- ✅ Ganti `prisma.room` → `prisma.kamar`
- ✅ Ganti `prisma.roomAssignment` → `prisma.penempatanSantri`
- ✅ Map property English ke Indonesian
- ✅ Update error message ke Indonesian

**Contoh:**
```typescript
// Sebelum
const building = await this.prisma.building.findFirst({ where: { id, tenantId } });
if (!building) throw new NotFoundException('Building not found');

// Sesudah
const building = await this.prisma.asrama.findFirst({ where: { id, tenantId } });
if (!building) throw new NotFoundException('Asrama tidak ditemukan');
```

## 🧪 Verifikasi

- ✅ Semua method sudah menggunakan model yang benar
- ✅ Tidak ada compilation error
- ✅ Mapping DTO ke model sudah benar
- ✅ Error message sudah Indonesian

## 🚀 Dampak Perbaikan

**Sebelum:**
```
User klik "Tambah Gedung" 
→ Service query ke model Building (lama)
→ Tapi Prisma schema punya Asrama (baru)
→ Mismatch → Gagal
```

**Sesudah:**
```
User klik "Tambah Gedung"
→ Service query ke model Asrama (benar)
→ Prisma schema punya Asrama
→ Match → Berhasil ✅
```

## 📝 Catatan Penting

### Mengapa Ada 2 Model?

Kemungkinan:
1. **Refactoring yang tidak lengkap** - Model Building lama belum dihapus
2. **Duplikasi saat development** - Ada 2 implementasi yang berbeda
3. **Migrasi yang belum selesai** - Transisi dari English ke Indonesian

### Rekomendasi Ke Depan

1. **Hapus model Building lama** (jika tidak digunakan di modul lain)
2. **Standardisasi naming** - Gunakan Indonesian untuk semua model
3. **Audit semua modul** - Cek apakah ada duplikasi model lainnya
4. **Update DTO naming** - Pertimbangkan rename `CreateBuildingDto` → `CreateAsramaDto`

## 🔗 Hubungan dengan Masalah DTO Kosong

Masalah ini **berbeda** dari masalah DTO kosong yang ditemukan sebelumnya:

| Aspek | DTO Kosong | Duplikasi Model |
|-------|-----------|-----------------|
| Penyebab | File DTO kosong | 2 model Prisma berbeda |
| Gejala | ValidationPipe error | Mismatch model |
| Solusi | Re-export DTO | Update service ke model baru |
| Status | ✅ FIXED | ✅ FIXED |

## 📋 Checklist

- ✅ Identifikasi duplikasi model
- ✅ Update service untuk menggunakan model baru
- ✅ Map DTO English ke model Indonesian
- ✅ Update error message
- ✅ Verifikasi tidak ada compilation error
- ✅ Test endpoint tambah gedung

---

**Status**: ✅ DIPERBAIKI
**Tanggal**: 2026-04-08
**File yang Dimodifikasi**: `backend/src/modules/dormitory/dormitory.service.ts`
