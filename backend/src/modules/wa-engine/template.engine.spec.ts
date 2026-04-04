import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TemplateEngine } from './template.engine';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('TemplateEngine', () => {
  let engine: TemplateEngine;
  let mockPrisma: { waTemplate: { findFirst: jest.Mock } };

  beforeEach(async () => {
    mockPrisma = {
      waTemplate: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateEngine,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    engine = module.get<TemplateEngine>(TemplateEngine);
  });

  describe('renderInline', () => {
    it('mengganti semua variabel {{variable}} dengan nilai yang diberikan', () => {
      const template = 'Halo {{nama}}, saldo Anda Rp{{saldo}}.';
      const result = engine.renderInline(template, { nama: 'Ahmad', saldo: '500000' });
      expect(result).toBe('Halo Ahmad, saldo Anda Rp500000.');
    });

    it('membiarkan placeholder jika variabel tidak diberikan', () => {
      const template = 'Halo {{nama}}, kelas {{kelas}}.';
      const result = engine.renderInline(template, { nama: 'Budi' });
      expect(result).toBe('Halo Budi, kelas {{kelas}}.');
    });

    it('mengganti multiple occurrences dari variabel yang sama', () => {
      const template = '{{nama}} hadir. Terima kasih {{nama}}.';
      const result = engine.renderInline(template, { nama: 'Candra' });
      expect(result).toBe('Candra hadir. Terima kasih Candra.');
    });

    it('menangani template tanpa variabel', () => {
      const template = 'Pesan tanpa variabel.';
      const result = engine.renderInline(template, {});
      expect(result).toBe('Pesan tanpa variabel.');
    });

    it('menangani nilai numerik', () => {
      const template = 'Poin: {{poin}}, Total: {{total}}';
      const result = engine.renderInline(template, { poin: 50, total: 200 });
      expect(result).toBe('Poin: 50, Total: 200');
    });
  });

  describe('render (dengan DB lookup)', () => {
    it('merender template dari DB dengan variabel yang diberikan', async () => {
      mockPrisma.waTemplate.findFirst.mockResolvedValue({
        body: "Assalamu'alaikum {{wali_nama}}, santri {{santri_nama}} telah hadir.",
      });

      const result = await engine.render('PRESENSI_MASUK', {
        wali_nama: 'Pak Hasan',
        santri_nama: 'Ahmad',
      });

      expect(result).toBe("Assalamu'alaikum Pak Hasan, santri Ahmad telah hadir.");
    });

    it('melempar NotFoundException jika template tidak ditemukan', async () => {
      mockPrisma.waTemplate.findFirst.mockResolvedValue(null);

      await expect(engine.render('TEMPLATE_TIDAK_ADA', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('menggunakan cache setelah lookup pertama', async () => {
      mockPrisma.waTemplate.findFirst.mockResolvedValue({
        body: 'Template {{key}}',
      });

      // Panggil dua kali
      await engine.render('TEST_KEY', { key: 'A' });
      await engine.render('TEST_KEY', { key: 'B' });

      // DB hanya dipanggil sekali (cache hit pada panggilan kedua)
      expect(mockPrisma.waTemplate.findFirst).toHaveBeenCalledTimes(1);
    });

    it('invalidateCache menghapus cache untuk key tertentu', async () => {
      mockPrisma.waTemplate.findFirst.mockResolvedValue({
        body: 'Template {{key}}',
      });

      await engine.render('TEST_KEY', { key: 'A' });
      engine.invalidateCache('TEST_KEY');
      await engine.render('TEST_KEY', { key: 'B' });

      // DB dipanggil dua kali setelah cache di-invalidate
      expect(mockPrisma.waTemplate.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('8 jenis notifikasi yang didukung', () => {
    const notificationTypes: Array<{ key: string; vars: Record<string, string | number> }> = [
      {
        key: 'PRESENSI_MASUK',
        vars: { wali_nama: 'Pak A', santri_nama: 'Ahmad', sesi_nama: 'Subuh', waktu: '05:00' },
      },
      {
        key: 'PRESENSI_KELUAR',
        vars: { wali_nama: 'Pak B', santri_nama: 'Budi', sesi_nama: 'Isya', waktu: '20:00' },
      },
      {
        key: 'PEMBAYARAN_BERHASIL',
        vars: { santri_nama: 'Candra', bulan: 'Januari', jumlah: '500000', invoice_number: 'INV-001' },
      },
      {
        key: 'PELANGGARAN',
        vars: { wali_nama: 'Pak D', santri_nama: 'Dani', pelanggaran_nama: 'Terlambat', tanggal: '2024-01-01', total_poin: '10' },
      },
      {
        key: 'REWARD',
        vars: { santri_nama: 'Eko', poin: '50', alasan: 'Juara kelas', tanggal: '2024-01-01', total_poin: '150' },
      },
      {
        key: 'IZIN_DISETUJUI',
        vars: { wali_nama: 'Pak F', santri_nama: 'Fajar', tanggal_mulai: '2024-01-10', tanggal_selesai: '2024-01-12' },
      },
      {
        key: 'KUNJUNGAN',
        vars: { wali_nama: 'Pak G', santri_nama: 'Gilang', waktu: '10:00', nama_tamu: 'Pak Hasan', hubungan: 'Ayah' },
      },
      {
        key: 'BUKU_PENGHUBUNG',
        vars: { wali_nama: 'Pak H', santri_nama: 'Hendra', wali_kelas_nama: 'Bu Sari', isi_catatan: 'Perkembangan baik' },
      },
      {
        key: 'TOPUP_BERHASIL',
        vars: { santri_nama: 'Irfan', jumlah: '100000', saldo_terkini: '350000' },
      },
    ];

    notificationTypes.forEach(({ key, vars }) => {
      it(`template ${key} dapat dirender dengan variabel yang sesuai`, () => {
        // Test renderInline dengan template dummy yang mengandung semua variabel
        const templateVars = Object.keys(vars)
          .map((k) => `{{${k}}}`)
          .join(' ');
        const expectedValues = Object.values(vars).join(' ');

        const result = engine.renderInline(templateVars, vars);
        expect(result).toBe(expectedValues);
      });
    });
  });
});
