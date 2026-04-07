import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SantriService } from './santri.service';
import { CreateSantriDto, SantriFilterDto, UpdateSantriDto } from './dto/santri.dto';

// ─── Mocks ────────────────────────────────────────────────────────────────────

function createMockPrisma(overrides: Partial<any> = {}) {
  return {
    santri: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    santriWali: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    wali: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
    ...overrides,
  };
}

function createMockAuditLog() {
  return { log: jest.fn().mockResolvedValue(undefined) };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-001';
const USER_ID = 'user-admin-001';

function makeSantri(overrides: Partial<any> = {}) {
  return {
    id: 'santri-001',
    tenantId: TENANT_ID,
    nis: 'PSN-2024-001',
    nisn: null,
    name: 'Ahmad Fulan',
    namaLengkap: 'Ahmad Fulan',
    namaPanggilan: null,
    gender: 'L',
    jenisKelamin: 'L',
    dob: null,
    tanggalLahir: null,
    tempatLahir: null,
    kelas: '10A',
    room: null,
    noHp: null,
    contact: null,
    address: null,
    alamat: null,
    fotoUrl: null,
    photo: null,
    tanggalMasuk: null,
    tanggalKeluar: null,
    status: 'AKTIF',
    deletedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    walis: [],
    _count: { izin: 0, pelanggaran: 0, invoices: 0 },
    ...overrides,
  };
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('SantriService', () => {
  // ─── 1. create — success ─────────────────────────────────────────────────────

  describe('create', () => {
    it('should create santri and record audit log on success', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const created = makeSantri();
      prisma.santri.findFirst.mockResolvedValue(null); // NIS not taken
      prisma.santri.create.mockResolvedValue(created);

      const dto: CreateSantriDto = {
        nis: 'PSN-2024-001',
        name: 'Ahmad Fulan',
        gender: 'L',
      };

      const result = await service.create(TENANT_ID, dto, USER_ID);

      expect(result).toEqual(created);
      expect(prisma.santri.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: TENANT_ID,
            nis: 'PSN-2024-001',
            name: 'Ahmad Fulan',
            status: 'AKTIF',
          }),
        }),
      );
      // Audit log must be called after creation — Req 3.5
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          aksi: 'CREATE_SANTRI',
          modul: 'santri',
          entitasId: created.id,
          userId: USER_ID,
        }),
      );
    });

    /**
     * Req 3.2 — NIS harus unik dalam sistem.
     * Membuat santri dengan NIS yang sudah digunakan harus ditolak dengan ConflictException.
     */
    it('should throw ConflictException when NIS is already used — Req 3.2', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      // Simulate existing active santri with same NIS
      prisma.santri.findFirst.mockResolvedValue(makeSantri({ nis: 'PSN-2024-001' }));

      const dto: CreateSantriDto = {
        nis: 'PSN-2024-001',
        name: 'Santri Lain',
        gender: 'P',
      };

      await expect(service.create(TENANT_ID, dto, USER_ID)).rejects.toThrow(ConflictException);
      await expect(service.create(TENANT_ID, dto, USER_ID)).rejects.toThrow(
        "NIS 'PSN-2024-001' sudah digunakan oleh santri lain",
      );
      // Must NOT create the record when NIS is duplicate
      expect(prisma.santri.create).not.toHaveBeenCalled();
    });

    it('should create santri without NIS (NIS is optional)', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const created = makeSantri({ nis: null });
      prisma.santri.create.mockResolvedValue(created);

      const dto: CreateSantriDto = { name: 'Santri Tanpa NIS', gender: 'P' };

      const result = await service.create(TENANT_ID, dto, USER_ID);

      expect(result).toEqual(created);
      // assertNisUnique should NOT be called when NIS is absent
      expect(prisma.santri.findFirst).not.toHaveBeenCalled();
    });

    it('should default status to AKTIF when not provided', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const created = makeSantri({ status: 'AKTIF' });
      prisma.santri.create.mockResolvedValue(created);

      const dto: CreateSantriDto = { name: 'Santri Baru', gender: 'L' };
      await service.create(TENANT_ID, dto, USER_ID);

      expect(prisma.santri.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'AKTIF' }),
        }),
      );
    });
  });

  // ─── 2. findAll — pencarian dan filter ───────────────────────────────────────

  describe('findAll', () => {
    it('should return only non-deleted santri records — Req 3.3', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const activeSantri = [makeSantri(), makeSantri({ id: 'santri-002', name: 'Budi' })];
      prisma.santri.findMany.mockResolvedValue(activeSantri);
      prisma.santri.count.mockResolvedValue(2);

      const filters: SantriFilterDto = {};
      const result = await service.findAll(TENANT_ID, filters);

      expect(result.data).toEqual(activeSantri);
      expect(result.meta.total).toBe(2);

      // The where clause must include deletedAt: null to exclude soft-deleted records
      expect(prisma.santri.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_ID, deletedAt: null }),
        }),
      );
    });

    it('should apply search filter across nama, NIS, and kelas — Req 3.6', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findMany.mockResolvedValue([]);
      prisma.santri.count.mockResolvedValue(0);

      const filters: SantriFilterDto = { search: 'Ahmad' };
      await service.findAll(TENANT_ID, filters);

      expect(prisma.santri.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'Ahmad' }) }),
              expect.objectContaining({ nis: expect.objectContaining({ contains: 'Ahmad' }) }),
              expect.objectContaining({ kelas: expect.objectContaining({ contains: 'Ahmad' }) }),
            ]),
          }),
        }),
      );
    });

    it('should filter by kelas when kelas filter is provided — Req 3.6', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findMany.mockResolvedValue([]);
      prisma.santri.count.mockResolvedValue(0);

      const filters: SantriFilterDto = { kelas: '10A' };
      await service.findAll(TENANT_ID, filters);

      expect(prisma.santri.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ kelas: '10A' }),
        }),
      );
    });

    it('should filter by status when status filter is provided — Req 3.6', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findMany.mockResolvedValue([]);
      prisma.santri.count.mockResolvedValue(0);

      const filters: SantriFilterDto = { status: 'ALUMNI' };
      await service.findAll(TENANT_ID, filters);

      expect(prisma.santri.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ALUMNI' }),
        }),
      );
    });

    it('should return correct pagination meta', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findMany.mockResolvedValue([makeSantri()]);
      prisma.santri.count.mockResolvedValue(25);

      const filters: SantriFilterDto = { page: 2, limit: 10 };
      const result = await service.findAll(TENANT_ID, filters);

      expect(result.meta).toEqual({ total: 25, page: 2, lastPage: 3 });
    });

    it('should restrict Wali_Santri to only see their own santri — Req 2.7', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findMany.mockResolvedValue([]);
      prisma.santri.count.mockResolvedValue(0);

      const filters: SantriFilterDto = {};
      const waliUser = { id: 'wali-user-001', role: 'Wali_Santri' };
      await service.findAll(TENANT_ID, filters, waliUser);

      expect(prisma.santri.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            walis: { some: { wali: { userId: 'wali-user-001' } } },
          }),
        }),
      );
    });
  });

  // ─── 3. findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('should return the correct santri record by id', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const santri = makeSantri();
      prisma.santri.findFirst.mockResolvedValue(santri);

      const result = await service.findOne('santri-001', TENANT_ID);

      expect(result).toEqual(santri);
      expect(prisma.santri.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'santri-001', tenantId: TENANT_ID, deletedAt: null }),
        }),
      );
    });

    it('should throw NotFoundException when santri does not exist', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', TENANT_ID)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when Wali_Santri accesses unrelated santri — Req 2.7', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findFirst.mockResolvedValue(makeSantri());
      prisma.santriWali.findFirst.mockResolvedValue(null); // no link

      const waliUser = { id: 'wali-user-999', role: 'Wali_Santri' };
      await expect(service.findOne('santri-001', TENANT_ID, waliUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow Wali_Santri to access their own santri', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const santri = makeSantri();
      prisma.santri.findFirst.mockResolvedValue(santri);
      prisma.santriWali.findFirst.mockResolvedValue({ santriId: 'santri-001', waliId: 'wali-001' });

      const waliUser = { id: 'wali-user-001', role: 'Wali_Santri' };
      const result = await service.findOne('santri-001', TENANT_ID, waliUser);

      expect(result).toEqual(santri);
    });
  });

  // ─── 4. update — audit log nilai sebelum dan sesudah ─────────────────────────

  describe('update', () => {
    /**
     * Req 3.5 — Audit log harus mencatat nilai sebelum dan sesudah perubahan,
     * timestamp server, dan identitas pengguna.
     */
    it('should update santri and record before/after values in audit log — Req 3.5', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const before = makeSantri({ kelas: '10A', status: 'AKTIF' });
      const after = makeSantri({ kelas: '11A', status: 'AKTIF' });

      prisma.santri.findFirst.mockResolvedValue(before);
      prisma.santri.update.mockResolvedValue(after);

      const dto: UpdateSantriDto = { kelas: '11A' };
      const result = await service.update('santri-001', TENANT_ID, dto, USER_ID);

      expect(result).toEqual(after);

      // Audit log must capture both before AND after values
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          aksi: 'UPDATE_SANTRI',
          userId: USER_ID,
          entitasId: 'santri-001',
          nilaiBefore: expect.objectContaining({ kelas: '10A' }),
          nilaiAfter: expect.objectContaining({ kelas: '11A' }),
        }),
      );
    });

    /**
     * Req 3.2 — NIS harus unik. Update ke NIS yang sudah dipakai santri lain harus ditolak.
     */
    it('should throw ConflictException when updating to a NIS already used by another santri — Req 3.2', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const existing = makeSantri({ nis: 'PSN-2024-001' });
      prisma.santri.findFirst
        .mockResolvedValueOnce(existing) // assertExists
        .mockResolvedValueOnce(makeSantri({ id: 'santri-999', nis: 'PSN-2024-002' })); // assertNisUnique finds conflict

      const dto: UpdateSantriDto = { nis: 'PSN-2024-002' };

      await expect(service.update('santri-001', TENANT_ID, dto, USER_ID)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.santri.update).not.toHaveBeenCalled();
    });

    it('should allow updating NIS to the same value (no conflict with self)', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const santri = makeSantri({ nis: 'PSN-2024-001' });
      prisma.santri.findFirst.mockResolvedValue(santri);
      prisma.santri.update.mockResolvedValue(santri);

      const dto: UpdateSantriDto = { nis: 'PSN-2024-001' };
      await expect(service.update('santri-001', TENANT_ID, dto, USER_ID)).resolves.not.toThrow();
      // update should proceed without NIS conflict check
      expect(prisma.santri.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when updating a non-existent santri', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', TENANT_ID, { name: 'X' }, USER_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── 5. remove — soft delete ─────────────────────────────────────────────────

  describe('remove (soft delete)', () => {
    /**
     * Req 3.3 — Soft delete: menghapus santri hanya menetapkan deletedAt,
     * tidak menghapus record dari database sehingga data historis tetap tersimpan.
     */
    it('should set deletedAt and NOT hard-delete the record — Req 3.3', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const santri = makeSantri();
      prisma.santri.findFirst.mockResolvedValue(santri);
      prisma.santri.update.mockResolvedValue({ ...santri, deletedAt: new Date() });

      const result = await service.remove('santri-001', TENANT_ID, USER_ID);

      // Must use update (soft delete), never prisma.santri.delete
      expect(prisma.santri.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'santri-001' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
      // Hard delete must never be called
      expect((prisma.santri as any).delete).toBeUndefined();

      expect(result).toEqual(
        expect.objectContaining({ message: expect.stringContaining('soft delete') }),
      );
    });

    it('should record audit log with before values on soft delete — Req 3.3 + 3.5', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      const santri = makeSantri({ nis: 'PSN-2024-001', name: 'Ahmad Fulan', status: 'AKTIF' });
      prisma.santri.findFirst.mockResolvedValue(santri);
      prisma.santri.update.mockResolvedValue({ ...santri, deletedAt: new Date() });

      await service.remove('santri-001', TENANT_ID, USER_ID);

      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          aksi: 'DELETE_SANTRI',
          userId: USER_ID,
          entitasId: 'santri-001',
          nilaiBefore: expect.objectContaining({
            nis: 'PSN-2024-001',
            name: 'Ahmad Fulan',
            status: 'AKTIF',
          }),
          nilaiAfter: expect.objectContaining({ deletedAt: expect.any(String) }),
        }),
      );
    });

    it('should throw NotFoundException when trying to delete a non-existent santri', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent', TENANT_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.santri.update).not.toHaveBeenCalled();
    });

    /**
     * Req 3.3 — Santri yang sudah di-soft-delete tidak boleh muncul di query normal.
     * findAll menggunakan where: { deletedAt: null } sehingga soft-deleted records tersembunyi.
     */
    it('should not appear in normal findAll queries after soft delete — Req 3.3', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      // After soft delete, findMany returns empty (DB filters out deletedAt != null)
      prisma.santri.findMany.mockResolvedValue([]);
      prisma.santri.count.mockResolvedValue(0);

      const result = await service.findAll(TENANT_ID, {});

      expect(result.data).toHaveLength(0);
      // Confirm the query always filters by deletedAt: null
      expect(prisma.santri.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        }),
      );
    });
  });

  // ─── 6. getHistory — data historis tetap tersedia setelah soft delete ─────────

  describe('getHistory', () => {
    /**
     * Req 3.3 — Data historis santri yang sudah di-soft-delete harus tetap
     * dapat diakses melalui endpoint history (audit log).
     */
    it('should return audit history for a soft-deleted santri — Req 3.3', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      // Soft-deleted santri — deletedAt is set
      const deletedSantri = makeSantri({ deletedAt: new Date('2024-06-01') });
      // getHistory uses findFirst WITHOUT deletedAt: null filter
      prisma.santri.findFirst.mockResolvedValue(deletedSantri);

      const auditEntries = [
        { id: 'log-1', action: 'CREATE_SANTRI', serverTimestamp: new Date('2024-01-01') },
        { id: 'log-2', action: 'DELETE_SANTRI', serverTimestamp: new Date('2024-06-01') },
      ];
      prisma.auditLog.findMany.mockResolvedValue(auditEntries);

      const result = await service.getHistory('santri-001', TENANT_ID);

      expect(result).toEqual(auditEntries);
      // findFirst must NOT filter by deletedAt: null (allows soft-deleted records)
      expect(prisma.santri.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ deletedAt: null }),
        }),
      );
    });

    it('should return audit entries ordered by serverTimestamp desc', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findFirst.mockResolvedValue(makeSantri());

      const auditEntries = [
        { id: 'log-3', action: 'UPDATE_SANTRI', serverTimestamp: new Date('2024-05-01') },
        { id: 'log-1', action: 'CREATE_SANTRI', serverTimestamp: new Date('2024-01-01') },
      ];
      prisma.auditLog.findMany.mockResolvedValue(auditEntries);

      const result = await service.getHistory('santri-001', TENANT_ID);

      expect(result).toEqual(auditEntries);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { serverTimestamp: 'desc' },
        }),
      );
    });

    it('should query audit log by entityId matching the santri id — Req 3.5', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findFirst.mockResolvedValue(makeSantri());
      prisma.auditLog.findMany.mockResolvedValue([]);

      await service.getHistory('santri-001', TENANT_ID);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityId: 'santri-001' }),
        }),
      );
    });

    it('should throw NotFoundException when santri id does not exist at all', async () => {
      const prisma = createMockPrisma();
      const auditLog = createMockAuditLog();
      const service = new SantriService(prisma as any, auditLog as any);

      prisma.santri.findFirst.mockResolvedValue(null);

      await expect(service.getHistory('nonexistent', TENANT_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
