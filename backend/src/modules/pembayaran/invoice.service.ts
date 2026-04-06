import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

// Invoice state machine — Requirement 11.2
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'EXPIRED', 'CANCELLED'],
  PAID: ['REFUNDED'],
  EXPIRED: [],
  CANCELLED: [],
  REFUNDED: [],
};

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Generate nomor invoice unik: INV-YYYYMM-XXXXX
   * Requirements: 11.1
   */
  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;

    // Find the highest sequence for this month
    const last = await this.prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let seq = 1;
    if (last?.invoiceNumber) {
      const parts = last.invoiceNumber.split('-');
      seq = parseInt(parts[2] ?? '0', 10) + 1;
    }

    return `${prefix}${String(seq).padStart(5, '0')}`;
  }

  /**
   * Buat invoice baru dengan nomor unik.
   * Requirements: 11.1
   */
  async createInvoice(tenantId: string, dto: CreateInvoiceDto, userId?: string) {
    const santri = await this.prisma.santri.findFirst({
      where: { id: dto.santriId, tenantId, deletedAt: null },
    });
    if (!santri) throw new NotFoundException('Santri tidak ditemukan');

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        santriId: dto.santriId,
        invoiceNumber,
        tipe: dto.tipe ?? 'SPP',
        jumlah: dto.jumlah,
        amountDue: Number(dto.jumlah),
        dueDate: new Date(dto.dueDate),
        status: 'PENDING',
        keterangan: dto.keterangan,
      },
      include: { santri: { select: { name: true, nis: true } } },
    });

    // Audit log — Requirement 11.6
    await this.auditLog.log({
      userId,
      aksi: 'CREATE_INVOICE',
      modul: 'pembayaran',
      entitasId: invoice.id,
      entitasTipe: 'Invoice',
      nilaiAfter: { invoiceNumber, jumlah: dto.jumlah, status: 'PENDING' },
    });

    return invoice;
  }

  /**
   * Daftar invoice dengan filter.
   */
  async findAll(
    tenantId: string,
    filters: { santriId?: string; status?: string; page?: number; limit?: number },
  ) {
    const { santriId, status, page = 1, limit = 20 } = filters;
    const where: any = { tenantId };
    if (santriId) where.santriId = santriId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { santri: { select: { name: true, nis: true } } },
        orderBy: { dueDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  /**
   * Konfirmasi pembayaran dengan SELECT FOR UPDATE + idempotency key.
   * Mencegah race condition — Requirement 11.4
   * Transisi status: PENDING → PAID — Requirement 11.3
   * Requirements: 11.3, 11.4, 11.6
   */
  async confirmPayment(
    tenantId: string,
    invoiceId: string,
    dto: ConfirmPaymentDto,
    userId: string,
    idempotencyKey?: string,
  ) {
    // Check idempotency key in Redis/cache if provided
    // For now we use DB-level locking via $transaction with serializable isolation

    return this.prisma.$transaction(
      async (tx) => {
        // SELECT FOR UPDATE — lock the row to prevent concurrent confirmation
        const invoice = await tx.$queryRaw<any[]>`
          SELECT * FROM invoices WHERE id = ${invoiceId} AND "tenantId" = ${tenantId}
          FOR UPDATE
        `;

        if (!invoice || invoice.length === 0) {
          throw new NotFoundException('Invoice tidak ditemukan');
        }

        const inv = invoice[0];

        // Idempotency: jika sudah PAID dengan idempotency key yang sama, return existing
        if (inv.status === 'PAID') {
          if (idempotencyKey && inv.idempotencyKey === idempotencyKey) {
            // Same key — idempotent response
            return tx.invoice.findUnique({ where: { id: invoiceId } });
          }
          throw new ConflictException('Invoice sudah dibayar (status: PAID)');
        }

        // Validasi transisi status
        const allowed = VALID_TRANSITIONS[inv.status] ?? [];
        if (!allowed.includes('PAID')) {
          throw new BadRequestException(
            `Tidak dapat mengkonfirmasi pembayaran. Status saat ini: ${inv.status}`,
          );
        }

        const now = new Date();

        // Update invoice ke PAID
        const updated = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PAID',
            paidAt: now,
            paidBy: userId,
            keterangan: dto.keterangan ?? inv.keterangan,
          },
          include: { santri: { select: { name: true, nis: true, walis: { include: { wali: true } } } } },
        });

        // Audit log — Requirement 11.6
        await this.auditLog.log({
          userId,
          aksi: 'CONFIRM_PAYMENT',
          modul: 'pembayaran',
          entitasId: invoiceId,
          entitasTipe: 'Invoice',
          nilaiBefore: { status: inv.status },
          nilaiAfter: { status: 'PAID', paidAt: now.toISOString(), paidBy: userId },
        });

        return updated;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  /**
   * Transisi status invoice (CANCELLED, REFUNDED, dll).
   * Requirements: 11.2
   */
  async transitionStatus(
    tenantId: string,
    invoiceId: string,
    newStatus: string,
    userId: string,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException('Invoice tidak ditemukan');

    const allowed = VALID_TRANSITIONS[invoice.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transisi status tidak valid: ${invoice.status} → ${newStatus}`,
      );
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: newStatus, updatedAt: new Date() },
    });

    await this.auditLog.log({
      userId,
      aksi: `INVOICE_STATUS_${newStatus}`,
      modul: 'pembayaran',
      entitasId: invoiceId,
      entitasTipe: 'Invoice',
      nilaiBefore: { status: invoice.status },
      nilaiAfter: { status: newStatus },
    });

    return updated;
  }

  /**
   * Tandai invoice PENDING yang melewati due_date menjadi EXPIRED.
   * Dipanggil oleh InvoiceExpiryJob — Requirement 11.2
   */
  async expireOverdueInvoices(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.invoice.updateMany({
      where: {
        status: 'PENDING',
        dueDate: { lt: now },
      },
      data: { status: 'EXPIRED', updatedAt: now },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} overdue invoice(s)`);
    }

    return result.count;
  }
}
