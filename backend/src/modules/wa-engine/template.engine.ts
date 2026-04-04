import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * TemplateEngine — render template pesan WA dengan variabel dinamis.
 * Template disimpan di tabel wa_templates dengan format {{variable}}.
 * Requirements: 18.5, 18.8
 *
 * Jenis notifikasi yang didukung (minimal 8):
 * - PRESENSI_MASUK, PRESENSI_KELUAR
 * - PEMBAYARAN_BERHASIL
 * - PELANGGARAN
 * - REWARD
 * - IZIN_DISETUJUI, IZIN_DITOLAK
 * - KUNJUNGAN
 * - BUKU_PENGHUBUNG
 * - TOPUP_BERHASIL
 */
@Injectable()
export class TemplateEngine {
  private readonly logger = new Logger(TemplateEngine.name);

  // Cache template in-memory untuk mengurangi query DB
  private readonly cache = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Render template berdasarkan key dengan variabel yang diberikan.
   * @param templateKey - key template (e.g. PRESENSI_MASUK)
   * @param variables - map variabel untuk substitusi
   * @returns pesan yang sudah dirender
   */
  async render(
    templateKey: string,
    variables: Record<string, string | number>,
  ): Promise<string> {
    const template = await this.getTemplate(templateKey);
    return this.substitute(template, variables);
  }

  /**
   * Render template dari string langsung (tanpa lookup DB).
   * Berguna untuk testing dan kasus khusus.
   */
  renderInline(
    template: string,
    variables: Record<string, string | number>,
  ): string {
    return this.substitute(template, variables);
  }

  /**
   * Ambil template dari DB (dengan cache in-memory).
   */
  async getTemplate(key: string): Promise<string> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const tmpl = await this.prisma.waTemplate.findFirst({
      where: { key, isActive: true },
      select: { body: true },
    });

    if (!tmpl) {
      this.logger.warn(`[TemplateEngine] Template not found: ${key}`);
      throw new NotFoundException(`WA template '${key}' tidak ditemukan`);
    }

    this.cache.set(key, tmpl.body);
    return tmpl.body;
  }

  /**
   * Invalidate cache untuk template tertentu (dipanggil saat template diupdate).
   */
  invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Substitusi variabel {{variable}} dalam template.
   * Variabel yang tidak ditemukan dibiarkan apa adanya.
   */
  private substitute(
    template: string,
    variables: Record<string, string | number>,
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      const value = variables[key];
      if (value === undefined || value === null) {
        this.logger.warn(`[TemplateEngine] Variable '${key}' not provided`);
        return match; // biarkan placeholder jika variabel tidak ada
      }
      return String(value);
    });
  }
}
